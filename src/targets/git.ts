import type { FsAdapter } from "../types.js"
import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	type Rule,
	extractGitignore,
} from "../patterns/index.js"
import { dirname, join, unixify } from "../unixify.js"
import { HOME, XDG, getCache, resP, merge, loadRec } from "./gitConfig.js"

const extractors: Extractor[] = [
	{ extract: extractGitignore, path: ".gitignore" },
	{ extract: extractGitignore, path: ".git/info/exclude" },
]

const gitDirCache = new WeakMap<FsAdapter, Map<string, string | null>>()
const excludesCache = new WeakMap<FsAdapter, Map<string, Rule[]>>()

const defIntRules = [
	ruleCompile({ compiled: null, excludes: true, pattern: [".git", ".DS_Store"] }),
]

function findGit(fs: FsAdapter, cur: string, cb: (g: string | null) => void) {
	const cache = getCache(gitDirCache, fs)
	const c = cache.get(cur)
	if (c !== undefined) return cb(c)
	fs.readdir(cur, (err, files) => {
		const g = !err && (files as string[]).includes(".git") ? join(cur, ".git") : null
		if (g) {
			cache.set(cur, g)
			return cb(g)
		}
		const p = dirname(cur)
		if (p === cur || !cur || cur === ".") {
			cache.set(cur, null)
			return cb(null)
		}
		findGit(fs, p, (res) => {
			cache.set(cur, res)
			cb(res)
		})
	})
}

function done(
	conf: any,
	gDir: string | null,
	cwd: string,
	fs: FsAdapter,
	target: Target,
	cb: () => void,
) {
	const core = conf["core"]
	let ex = core ? core["excludesfile"] : null
	if (!ex) ex = XDG ? join(XDG, "git/ignore") : join(HOME, ".config/git/ignore")
	const p = resP(gDir || cwd, ex)
	const cache = getCache(excludesCache, fs)
	const cached = cache.get(p)
	if (cached) {
		target.internalRules = [...defIntRules, ...cached]
		return cb()
	}

	const i: Rule = { compiled: null, excludes: false, pattern: [] }
	const e: Rule = { compiled: null, excludes: true, pattern: [] }
	fs.readFile(p, (err, res) => {
		if (err || !res) {
			const rules = [ruleCompile(i), ruleCompile(e)]
			cache.set(p, rules)
			target.internalRules = [...defIntRules, ...rules]
			return cb()
		}
		const d: any = { rules: [] }
		extractGitignore(d, res)
		const rs = d.rules
		for (let idx = 0, rl = rs.length; idx < rl; idx++) {
			const r = rs[idx]!
			;(r.excludes ? e : i).pattern.push(...r.pattern)
		}
		const rules = [ruleCompile(i), ruleCompile(e)]
		cache.set(p, rules)
		target.internalRules = [...defIntRules, ...rules]
		cb()
	})
}

/**
 * @since 0.6.0
 */
export const Git: Target = <Target>{
	extractors,
	ignores: ruleTest,
	init({ fs, cwd, signal, target }, cb) {
		const nCwd = unixify(cwd)
		findGit(fs, nCwd, (gDir) => {
			if (signal?.aborted) return cb()
			const m: any = {}
			const confs: string[] = []
			if (HOME) confs.push(join(HOME, ".gitconfig"))
			if (XDG) confs.push(join(XDG, "git/config"))
			if (gDir) {
				confs.push(join(gDir, "config"))
				target.root = dirname(gDir)
			}

			let len = confs.length
			if (!len) return done(m, gDir, nCwd, fs, target, cb)

			const start = (branch: string | null) => {
				const vals = Array.from({ length: len })
				let pending = len
				for (let i = 0; i < len; i++) {
					loadRec(fs, confs[i]!, gDir, branch, signal, (res) => {
						vals[i] = res
						if (--pending !== 0) return
						for (let j = 0; j < len; j++) {
							const v = vals[j]
							if (v) merge(m, v)
						}
						done(m, gDir, nCwd, fs, target, cb)
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
	internalRules: defIntRules,
	root: "/",
}
