import type { FsAdapter } from "../types.js"
import type { Target } from "./target.js"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type InternalRules,
	type Source,
	type GlobRule,
} from "../patterns/index.js"
import { unixify, join, dirname } from "../unixify.js"
import { HOME, XDG, resolvePath, loadRec, mergeConfig, getCache } from "./gitConfig.js"

const findGCache = new WeakMap<FsAdapter, Map<string, string | null>>()
const branchCache = new WeakMap<FsAdapter, Map<string, string | null>>()

const globalIgnore = XDG ? join(XDG, "git/ignore") : join(HOME, ".config/git/ignore")

let cachedGitRule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeGit(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractGitignore,
			path: ".gitignore",
		},
	]

	cachedGitRule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [".git"],
	})

	const internal: InternalRules = {
		after: [],
		before: [cachedGitRule],
	}

	return {
		extractors,
		ignores: ruleTest,
		init({ fs, cwd, signal, target }, cb) {
			const nCwd = unixify(cwd)

			// Loads standard user excludes and repository-specific info/exclude patterns, mirroring Git's setup_standard_excludes function.
			// https://github.com/git/git/blob/13c7afec212fc97ce257d15601659314c6673d6c/dir.c#L3482
			const finalize = (
				// oxlint-disable-next-line typescript/no-explicit-any
				conf: any,
				gDir: string | null,
			) => {
				const { core } = conf
				const ignorecase = core
					? String(core["ignorecase"]).toLowerCase() === "true" || core["ignorecase"] === true
					: false

				if (ignorecase) {
					target.extractors[0]!.extract = (source, content) =>
						extractGitignore(source, content, { nocase: true })
				}

				const ex = core ? core["excludesfile"] : null
				const p = ex ? resolvePath(gDir || nCwd, ex) : resolvePath(gDir || nCwd, globalIgnore)

				const excludePath = gDir ? join(gDir, "info/exclude") : null
				let pending = excludePath ? 2 : 1
				const done = () => {
					if (--pending === 0) cb(null)
				}

				const loadIgnoreFile = (filePath: string, sourcePath: string) => {
					fs.readFile(filePath, (err, res) => {
						if (err || !res) {
							done()
							return
						}

						const source: Source = {
							inverted: false,
							path: sourcePath,
							rules: [],
						}
						extractGitignore(source, res, { nocase: ignorecase })
						internal.after.push(...source.rules)
						done()
					})
				}

				loadIgnoreFile(p, p)

				if (excludePath) loadIgnoreFile(excludePath, ".git/info/exclude")
			}

			const findG = (cur: string, callback: (g: string | null) => void) => {
				let m = findGCache.get(fs)
				if (!m) findGCache.set(fs, (m = new Map()))
				const cached = m.get(cur)
				if (cached !== undefined) return callback(cached)

				fs.stat(join(cur, ".git"), (err, st) => {
					if (!err && st) {
						const res = join(cur, ".git")
						m!.set(cur, res)
						return callback(res)
					}
					const p = dirname(cur)
					if (p === cur || !cur || cur === ".") {
						m!.set(cur, null)
						return callback(null)
					}
					findG(p, (res) => {
						m!.set(cur, res)
						callback(res)
					})
				})
			}

			findG(nCwd, (gDir) => {
				if (signal?.aborted) return cb(null)
				// oxlint-disable-next-line typescript/no-explicit-any
				const m: any = {}
				const confs: string[] = []
				if (HOME) confs.push(join(HOME, ".gitconfig"))
				if (XDG) confs.push(join(XDG, "git/config"))
				if (gDir) {
					confs.push(join(gDir, "config"))
					target.root = dirname(gDir)
				}

				if (!confs.length) return finalize(m, gDir)

				const start = (branch: string | null) => {
					let pending = confs.length
					for (const confPath of confs) {
						loadRec(fs, confPath, gDir, branch, signal, (res) => {
							if (res) mergeConfig(m, res)
							if (--pending === 0) finalize(m, gDir)
						})
					}
				}

				if (!gDir) return start(null)

				const bCache = getCache(branchCache, fs)
				const headPath = join(gDir, "HEAD")
				const bCached = bCache.get(headPath)
				if (bCached !== undefined) return start(bCached)

				fs.readFile(headPath, (err, res) => {
					if (err || !res) {
						bCache.set(headPath, null)
						return start(null)
					}
					const s = res.toString().trim()
					const branch = s.startsWith("ref: refs/heads/") ? s.slice(16) : null
					bCache.set(headPath, branch)
					start(branch)
				})
			})
		},
		internalRules: internal,
		root: "/",
	}
}
