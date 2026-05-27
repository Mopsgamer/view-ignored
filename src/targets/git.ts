import type { FsAdapter } from "../types.js"
import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	type Rule,
	extractGitignore,
	patternCompile,
} from "../patterns/index.js"
import { dirname, join, unixify } from "../unixify.js"

const extractors: Extractor[] = [
	{ extract: extractGitignore, path: ".gitignore" },
	{ extract: extractGitignore, path: ".git/info/exclude" },
]

const env = typeof process !== "undefined" ? process.env : {}
const HOME = (env.HOME || env.USERPROFILE || "").replaceAll("\\", "/")
const XDG = (env.XDG_CONFIG_HOME || (HOME ? HOME + "/.config" : "")).replaceAll("\\", "/")

const confCache = new WeakMap<FsAdapter, Map<string, any>>()
const gitDirCache = new WeakMap<FsAdapter, Map<string, string | null>>()
const patternCache = new Map<string, any>()
const excludesCache = new WeakMap<FsAdapter, Map<string, Rule[]>>()

const defIntRules = [ruleCompile({ compiled: null, excludes: true, pattern: [".git", ".DS_Store"] })]

const getCache = <K, V>(wm: WeakMap<FsAdapter, Map<K, V>>, fs: FsAdapter) => {
	let m = wm.get(fs)
	if (!m) wm.set(fs, (m = new Map()))
	return m
}

const resH = (p: string) =>
	p.charCodeAt(0) === 126 && p.charCodeAt(1) === 47 ? join(HOME, p.slice(2)) : p

const resP = (base: string, p: string) => {
	p = resH(p)
	const c0 = p.charCodeAt(0)
	return c0 === 47 || p.includes(":") ? p : join(base, c0 === 46 && p.charCodeAt(1) === 47 ? p.slice(2) : p)
}

function merge(target: any, source: any) {
	for (const k in source) {
		const v = source[k]
		if (v && typeof v === "object" && !Array.isArray(v)) {
			merge((target[k] ||= {}), v)
		} else target[k] = v
	}
}

function parseGit(text: string) {
	const obj: any = {}
	let section: any = null
	let i = 0
	const len = text.length
	while (i < len) {
		const c = text.charCodeAt(i)
		if (c <= 32) {
			i++
			continue
		}
		if (c === 35 || c === 59) {
			while (++i < len && text.charCodeAt(i) !== 10);
			continue
		}
		if (c === 91) {
			let s = ++i
			while (i < len && text.charCodeAt(i) !== 93) i++
			let e = i
			while (s < e && text.charCodeAt(s) <= 32) s++
			while (e > s && text.charCodeAt(e - 1) <= 32) e--
			section = obj[text.slice(s, e).toLowerCase()] ||= {}
			while (++i < len && text.charCodeAt(i) !== 10);
			continue
		}
		if (!section) {
			while (++i < len && text.charCodeAt(i) !== 10);
			continue
		}
		const kS = i
		while (i < len && text.charCodeAt(i) !== 61 && text.charCodeAt(i) !== 10) i++
		if (i >= len || text.charCodeAt(i) === 10) {
			i++
			continue
		}
		let kE = i
		while (kE > kS && text.charCodeAt(kE - 1) <= 32) kE--
		const key = text.slice(kS, kE).toLowerCase()
		i++
		while (i < len && text.charCodeAt(i) <= 32 && text.charCodeAt(i) !== 10) i++
		const vS = i
		while (i < len && text.charCodeAt(i) !== 10 && text.charCodeAt(i) !== 35 && text.charCodeAt(i) !== 59) i++
		let vE = i
		while (vE > vS && text.charCodeAt(vE - 1) <= 32) vE--
		let val = text.slice(vS, vE)
		if (val.charCodeAt(0) === 34 && val.charCodeAt(val.length - 1) === 34) {
			val = val.slice(1, -1)
			if (val.indexOf("\\") !== -1) val = val.replace(/\\(.)/g, "$1")
		}
		if (key === "path") (section[key] ||= []).push(val)
		else section[key] = val
	}
	return obj
}

function getInc(parsed: any, gitDir: string | null): string[] {
	const res: string[] = []
	const inc = parsed["include"]
	if (inc?.path) {
		if (Array.isArray(inc.path)) res.push(...inc.path)
		else res.push(inc.path)
	}
	if (!gitDir) return res
	const gD = gitDir.charCodeAt(0) === 47 ? gitDir.slice(1) : gitDir
	for (const s in parsed) {
		if (!s.startsWith('includeif "')) continue
		const c = s.slice(11, -1)
		if (!c.startsWith("gitdir:")) continue
		const pat = resH(c.slice(7))
		let compiled = patternCache.get(pat)
		if (!compiled) patternCache.set(pat, (compiled = patternCompile(pat)))
		if (!compiled.re.test(gD, {})) continue
		const p = parsed[s].path
		if (Array.isArray(p)) res.push(...p)
		else if (p) res.push(p)
	}
	return res
}

function loadRec(
	fs: FsAdapter,
	path: string,
	gitDir: string | null,
	sig: AbortSignal | null,
	cb: (c: any) => void,
) {
	if (sig?.aborted) return cb(null)
	const cache = getCache(confCache, fs)
	const c = cache.get(path)
	if (c && !gitDir) return cb(c)

	fs.readFile(path, (err, res) => {
		if (err) return cb(null)
		const p = parseGit(res!.toString())
		if (!gitDir) cache.set(path, p)
		const inc = getInc(p, gitDir)
		let len = inc.length
		if (!len) return cb(p)
		const dir = dirname(path)
		const vals = new Array(len)
		let pending = len
		for (let i = 0; i < len; i++) {
			loadRec(fs, resP(dir, inc[i]!), gitDir, sig, (v) => {
				vals[i] = v
				if (--pending === 0) {
					for (const v of vals) if (v) merge(p, v)
					cb(p)
				}
			})
		}
	})
}

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
		if (!err && res) {
			const d: any = { rules: [] }
			extractGitignore(d, res)
			const rs = d.rules
			for (let idx = 0, rl = rs.length; idx < rl; idx++) {
				const r = rs[idx]!; (r.excludes ? e : i).pattern.push(...r.pattern)
			}
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

			const vals = new Array(len)
			let pending = len
			for (let i = 0; i < len; i++) {
				loadRec(fs, confs[i]!, gDir, signal, (res) => {
					vals[i] = res
					if (--pending === 0) {
						for (let j = 0; j < len; j++) {
							const v = vals[j]; if (v) merge(m, v)
						}
						done(m, gDir, nCwd, fs, target, cb)
					}
				})
			}
		})
	},
	internalRules: defIntRules,
	root: "/",
}

/**
 * Creates a new Git target.
 *
 * @since 0.11.1
 */
export function createGit(): Target {
	return { ...Git, internalRules: [...Git.internalRules] }
}
