import type { Target } from "./target.js"
import * as ini from "ini"
import micromatch from "micromatch"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	type Rule,
	extractGitignore,
} from "../patterns/index.js"
import { dirname, join, unixify } from "../unixify.js"
import type { FsAdapter } from "../types.js"

const extractors: Extractor[] = [
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
	{
		extract: extractGitignore,
		path: ".git/info/exclude",
	},
]

const env = typeof process !== "undefined" ? process.env : {}
const HOME = (env.HOME || env.USERPROFILE || "").replaceAll("\\", "/")
const XDG_CONFIG_HOME = (env.XDG_CONFIG_HOME || (HOME ? HOME + "/.config" : "")).replaceAll(
	"\\",
	"/",
)

function resolveHome(path: string): string {
	if (path.startsWith("~/")) {
		return join(HOME, path.substring(2))
	}
	return path
}

function resolvePath(baseDir: string, path: string): string {
	path = resolveHome(path)
	if (!path.startsWith("/") && !path.includes(":") && !path.startsWith("./")) {
		return join(baseDir, path)
	}
	if (path.startsWith("./")) {
		return join(baseDir, path.substring(2))
	}
	return path
}

function gitdirMatches(gitdirPattern: string, gitDir: string): boolean {
	let pattern = resolveHome(gitdirPattern)
	if (pattern.endsWith("/")) pattern += "**"
	if (!pattern.startsWith("/") && !pattern.startsWith("./") && !pattern.startsWith("**/")) {
		pattern = "**/" + pattern
	}
	return micromatch.isMatch(gitDir, pattern, {
		dot: true,
		nocase: typeof process !== "undefined" && process.platform === "win32",
	})
}

function findCaseInsensitive(obj: any, key: string): any {
	if (!obj) return undefined
	const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase())
	return foundKey ? obj[foundKey] : undefined
}

function deepMerge(target: any, source: any) {
	for (const key in source) {
		const val = source[key]
		if (val && typeof val === "object" && !Array.isArray(val)) {
			const targetKey = Object.keys(target).find((k) => k.toLowerCase() === key.toLowerCase()) || key
			if (!target[targetKey]) target[targetKey] = {}
			deepMerge(target[targetKey], val)
		} else {
			const targetKey = Object.keys(target).find((k) => k.toLowerCase() === key.toLowerCase()) || key
			target[targetKey] = val
		}
	}
}

function loadConfigRecursive(
	fs: FsAdapter,
	configPath: string,
	gitDir: string | null,
	signal: AbortSignal | null,
	cb: (err: Error | null, config: any) => void,
) {
	if (signal?.aborted) return cb(signal.reason, null)

	fs.readFile(configPath, (err, content) => {
		if (err) return cb(null, null)

		const raw = content!.toString()
		const parsed = ini.parse(raw.replace(/^[ \t]*path\s*=/gm, "path[]="))

		const configDir = dirname(configPath)
		const includes: string[] = []

		const includeSection = findCaseInsensitive(parsed, "include")
		if (includeSection) {
			const p = findCaseInsensitive(includeSection, "path")
			if (Array.isArray(p)) {
				includes.push(...p)
			} else if (typeof p === "string") {
				includes.push(p)
			}
		}

		if (gitDir) {
			for (const section in parsed) {
				if (section.toLowerCase().startsWith('includeif "')) {
					const condition = section.substring(11, section.length - 1)
					if (condition.startsWith("gitdir:")) {
						const pattern = condition.substring(7)
						if (gitdirMatches(pattern, gitDir)) {
							const val = parsed[section]
							const p = findCaseInsensitive(val, "path")
							if (Array.isArray(p)) {
								includes.push(...p)
							} else if (typeof p === "string") {
								includes.push(p)
							}
						}
					}
				}
			}
		}

		if (includes.length === 0) {
			return cb(null, parsed)
		}

		let index = 0
		function next() {
			if (index >= includes.length) {
				return cb(null, parsed)
			}
			const incPath = resolvePath(configDir, includes[index++]!)

			loadConfigRecursive(fs, incPath, gitDir, signal, (err, incConfig) => {
				if (incConfig) {
					deepMerge(parsed, incConfig)
				}
				next()
			})
		}
		next()
	})
}

function findGitDir(fs: FsAdapter, cwd: string, cb: (gitDir: string | null) => void): void {
	let current = cwd
	function check() {
		fs.readdir(current, (err, files) => {
			if (!err && files) {
				for (const name of files as string[]) {
					if (name === ".git") {
						return cb(join(current, ".git"))
					}
				}
			}
			const parent = dirname(current)
			if (parent === current || !current || current === ".") {
				return cb(null)
			}
			current = parent
			check()
		})
	}
	check()
}

/**
 * @since 0.6.0
 */
export const Git: Target = <Target>{
	extractors,
	ignores: ruleTest,
	init({ fs, cwd, signal, target }, cb) {
		const normalCwd = unixify(cwd)

		findGitDir(fs, normalCwd, (gitDir) => {
			if (signal?.aborted) return cb(signal.reason)

			const configsToLoad: string[] = []
			if (HOME) {
				configsToLoad.push(join(HOME, ".gitconfig"))
			}
			if (XDG_CONFIG_HOME) {
				configsToLoad.push(join(XDG_CONFIG_HOME, "git/config"))
			}
			if (gitDir) {
				configsToLoad.push(join(gitDir, "config"))
				target.root = dirname(gitDir)
			}

			const mergedConfig: any = {}

			function nextConfig() {
				if (configsToLoad.length === 0) {
					return finalize()
				}
				const configPath = configsToLoad.shift()!
				loadConfigRecursive(fs, configPath, gitDir, signal, (err, config) => {
					if (config) {
						deepMerge(mergedConfig, config)
					}
					nextConfig()
				})
			}

			function finalize() {
				const core = findCaseInsensitive(mergedConfig, "core")
				let excludesFile = findCaseInsensitive(core, "excludesfile")

				if (!excludesFile) {
					if (XDG_CONFIG_HOME) {
						excludesFile = join(XDG_CONFIG_HOME, "git/ignore")
					} else if (HOME) {
						excludesFile = join(HOME, ".config/git/ignore")
					}
				}

				const fromConfigsInclude: Rule = {
					compiled: null,
					excludes: false,
					pattern: [],
				}

				const fromConfigsExclude: Rule = {
					compiled: null,
					excludes: true,
					pattern: [],
				}

				const finish = () => {
					ruleCompile(fromConfigsInclude)
					ruleCompile(fromConfigsExclude)

					target.internalRules = [
						ruleCompile({
							compiled: null,
							excludes: true,
							pattern: [".git", ".DS_Store"],
						}),
						fromConfigsInclude,
						fromConfigsExclude,
					]
					cb()
				}

				if (excludesFile) {
					excludesFile = resolvePath(gitDir || normalCwd, excludesFile)
					fs.readFile(excludesFile, (err, content) => {
						if (!err && content) {
							const dummySource = { inverted: false, path: excludesFile, rules: [] } as any
							extractGitignore(dummySource, content)
							for (const rule of dummySource.rules) {
								if (rule.excludes) fromConfigsExclude.pattern.push(...rule.pattern)
								else fromConfigsInclude.pattern.push(...rule.pattern)
							}
						}

						finish()
					})
				} else {
					finish()
				}
			}

			nextConfig()
		})
	},
	internalRules: [
		ruleCompile({
			compiled: null,
			excludes: true,
			pattern: [".git", ".DS_Store"],
		}),
	],
	root: "/",
}
