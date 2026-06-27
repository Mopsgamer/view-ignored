import type { FsAdapter } from "../types.js"
import type { Target } from "./target.js"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type InternalRules,
	type Source,
} from "../patterns/index.js"
import { unixify, join, dirname } from "../unixify.js"
import { HOME, XDG, resolvePath, loadRec, mergeConfig } from "./gitConfig.js"

const findGCache = new WeakMap<FsAdapter, Map<string, string | null>>()

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

	const internal: InternalRules = {
		after: [],
		before: [
			ruleCompile({
				compiled: null,
				excludes: true,
				pattern: [".git", ".DS_Store"],
			}),
		],
	}

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd, signal, target }, cb) {
			const nCwd = unixify(cwd)

			const finalize = (
				// oxlint-disable-next-line typescript/no-explicit-any
				conf: any,
				gDir: string | null,
			) => {
				const core = conf["core"]
				let ex = core ? core["excludesfile"] : null
				if (!ex) ex = XDG ? join(XDG, "git/ignore") : join(HOME, ".config/git/ignore")
				const p = resolvePath(gDir || nCwd, ex)

				const excludePath = gDir ? join(gDir, "info/exclude") : null
				let pending = excludePath ? 2 : 1
				const done = () => {
					if (--pending === 0) cb(null)
				}

				fs.readFile(p, (err, res) => {
					if (!err && res) {
						const source = <Source>{
							inverted: false,
							path: p,
							rules: [],
						}
						extractGitignore(source, res)
						internal.after.push(...source.rules)
					}
					done()
				})

				if (excludePath) {
					fs.readFile(excludePath, (err2, content) => {
						if (!err2 && content) {
							const source = <Source>{
								inverted: false,
								path: ".git/info/exclude",
								rules: [],
							}
							extractGitignore(source, content)
							internal.after.push(...source.rules)
						}
						done()
					})
				}
			}

			const findG = (cur: string, callback: (g: string | null) => void) => {
				let m = findGCache.get(fs)
				if (!m) findGCache.set(fs, (m = new Map()))
				const cached = m.get(cur)
				if (cached !== undefined) return callback(cached)

				const onDone = (found: boolean) => {
					if (found) {
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
				}

				if (fs.stat) {
					fs.stat(join(cur, ".git"), (err, st) => {
						onDone(!err && !!st)
					})
				} else {
					fs.readdir(cur, (err, files) => {
						onDone(!err && (files as string[]).includes(".git"))
					})
				}
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
				fs.readFile(join(gDir, "HEAD"), (err, res) => {
					if (err || !res) return start(null)
					const s = res.toString().trim()
					start(s.startsWith("ref: refs/heads/") ? s.slice(16) : null)
				})
			})
		},
		internalRules: internal,
		needsSource: false,
		root: "/",
	}
}
