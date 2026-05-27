import { dirname, join } from "../unixify.js"
import { patternCompile } from "../patterns/index.js"
import type { FsAdapter } from "../types.js"

const env = typeof process !== "undefined" ? process.env : {}
export const HOME = (env.HOME || env.USERPROFILE || "").replaceAll("\\", "/")
export const XDG = (env.XDG_CONFIG_HOME || (HOME ? HOME + "/.config" : "")).replaceAll("\\", "/")

export const resH = (p: string) =>
	p.charCodeAt(0) === 126 && p.charCodeAt(1) === 47 ? join(HOME, p.slice(2)) : p

export const resP = (base: string, p: string) => {
	p = resH(p)
	const c0 = p.charCodeAt(0)
	return c0 === 47 || p.includes(":") ? p : join(base, c0 === 46 && p.charCodeAt(1) === 47 ? p.slice(2) : p)
}

export function merge(target: any, source: any) {
	for (const k in source) {
		const v = source[k]
		if (v && typeof v === "object" && !Array.isArray(v)) {
			merge((target[k] ||= {}), v)
		} else target[k] = v
	}
}

export function parseGit(text: string) {
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

const patternCache = new Map<string, any>()

export function getInc(parsed: any, gitDir: string | null): string[] {
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
		if (compiled.re.test(gD, {})) {
			const p = parsed[s].path
			if (Array.isArray(p)) res.push(...p)
			else if (p) res.push(p)
		}
	}
	return res
}

const confCache = new WeakMap<FsAdapter, Map<string, any>>()

export const getCache = <K, V>(wm: WeakMap<FsAdapter, Map<K, V>>, fs: FsAdapter) => {
	let m = wm.get(fs)
	if (!m) wm.set(fs, (m = new Map()))
	return m
}

export function loadRec(
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
