import type { FsAdapter } from "../types.js"

import { patternCompile } from "../patterns/index.js"
import { dirname, join, strip } from "../unixify.js"

const enum MatchMode {
	normal = 0,
	unsensitive = 1,
	wildmatch = 2,
	lowered = 4,
}

const env = typeof process !== "undefined" ? process.env : {}

export const HOME = (env.HOME || env.USERPROFILE || "").replaceAll("\\", "/")
export const XDG = (env.XDG_CONFIG_HOME || (HOME ? HOME + "/.config" : "")).replaceAll("\\", "/")

function resolveHome(p: string): string {
	if (p.charCodeAt(0) === 126 && p.charCodeAt(1) === 47) {
		return join(HOME, p.slice(2))
	}
	return p
}

export function resolvePath(base: string, p: string): string {
	const resolved = resolveHome(p)
	const c0 = resolved.charCodeAt(0)
	if (c0 === 47 || resolved.includes(":")) return resolved
	const path = c0 === 46 && resolved.charCodeAt(1) === 47 ? resolved.slice(2) : resolved
	return join(base, path)
}

// oxlint-disable-next-line typescript/no-explicit-any
export function mergeConfig(target: any, source: any): void {
	for (const k in source) {
		const v = source[k]
		if (!v || typeof v !== "object" || Array.isArray(v)) {
			target[k] = v
			continue
		}
		mergeConfig((target[k] ||= {}), v)
	}
}

// oxlint-disable-next-line typescript/no-explicit-any
export function parseGit(text: string): any {
	// oxlint-disable-next-line typescript/no-explicit-any
	const obj: any = {}
	const order: string[] = []
	// oxlint-disable-next-line typescript/no-explicit-any
	let section: any = null
	let sectionName: string | null = null
	let i = 0
	const len = text.length

	while (i < len) {
		const c = text.charCodeAt(i)

		switch (c) {
			case 32: // whitespace
			case 9: // tab
				i++
				continue
			case 35: // comment
			case 59:
				while (++i < len && text.charCodeAt(i) !== 10);
				continue
			case 91: // section header
				const res = parseSectionHeader(text, i, len)
				i = res.nextIdx
				sectionName = res.sectionName
				section = obj[sectionName] ||= {}
				continue
		}

		if (section) {
			const res = parseKeyValuePair(text, i, len)
			i = res.nextIdx
			if (res.key) {
				if (res.key === "path") {
					;(section[res.key] ||= []).push(res.val)
					if (sectionName === "include" || sectionName?.startsWith('includeif "')) {
						order.push(sectionName + ":" + (section[res.key].length - 1))
					}
				} else {
					section[res.key] = res.val
				}
			}
			continue
		}

		while (++i < len && text.charCodeAt(i) !== 10);
	}

	if (order.length > 0) obj.__order = order
	return obj
}

function parseSectionHeader(text: string, i: number, len: number) {
	let s = ++i
	while (i < len && text.charCodeAt(i) !== 93) i++
	let e = i
	while (s < e && text.charCodeAt(s) <= 32) s++
	while (e > s && text.charCodeAt(e - 1) <= 32) e--

	let name = text.slice(s, e)
	const sp = name.indexOf(" ")
	if (sp !== -1) {
		let sub = name.slice(sp + 1).trim()
		if (sub.charCodeAt(0) === 34 && sub.charCodeAt(sub.length - 1) === 34) {
			sub = sub.slice(1, -1)
		}
		name = name.slice(0, sp).toLowerCase() + ' "' + sub + '"'
	} else {
		name = name.toLowerCase()
	}

	while (++i < len && text.charCodeAt(i) !== 10);
	return { nextIdx: i, sectionName: name }
}

function parseKeyValuePair(text: string, i: number, len: number) {
	const kS = i
	while (i < len && text.charCodeAt(i) !== 61 && text.charCodeAt(i) !== 10) i++

	let kE = i
	while (kE > kS && text.charCodeAt(kE - 1) <= 32) kE--

	if (i >= len || text.charCodeAt(i) === 10) {
		const key = kS < kE ? text.slice(kS, kE).toLowerCase() : null
		return { key, nextIdx: i + 1, val: true }
	}

	const key = text.slice(kS, kE).toLowerCase()

	i++
	while (i < len && text.charCodeAt(i) <= 32 && text.charCodeAt(i) !== 10) i++

	const vS = i
	while (
		i < len &&
		text.charCodeAt(i) !== 10 &&
		text.charCodeAt(i) !== 35 &&
		text.charCodeAt(i) !== 59
	)
		i++

	let vE = i
	while (vE > vS && text.charCodeAt(vE - 1) <= 32) vE--

	let val: string | boolean = text.slice(vS, vE)
	if (val.charCodeAt(0) === 34 && val.charCodeAt(val.length - 1) === 34) {
		val = unescapeGitValue(val.slice(1, -1))
	}

	return { key, nextIdx: i, val }
}

function unescapeGitValue(val: string): string {
	if (val.indexOf("\\") === -1) return val
	let next = ""
	for (let j = 0; j < val.length; j++) {
		if (val[j] === "\\" && j + 1 < val.length) {
			next += val[++j]
		} else {
			next += val[j]
		}
	}
	return next
}

// oxlint-disable-next-line typescript/no-explicit-any
const patternCacheMap = new Map<string, any>()

function testPattern(pat: string, str: string, mode: MatchMode = MatchMode.normal) {
	const key = pat + (mode & MatchMode.unsensitive ? "/i" : "")
	let c = patternCacheMap.get(key)
	if (!c) {
		// oxlint-disable-next-line typescript/no-explicit-any
		c = (patternCompile as any)(pat, undefined, { nocase: !!(mode & MatchMode.unsensitive) })
		patternCacheMap.set(key, c)
	}
	return c.re.test(
		str,
		mode & MatchMode.unsensitive && !(mode & MatchMode.lowered) ? str.toLowerCase() : undefined,
	)
}

// oxlint-disable-next-line typescript/no-explicit-any
function hasConfig(obj: any, cond: string): boolean {
	const eq = cond.indexOf("=")
	const key = eq === -1 ? cond : cond.slice(0, eq)
	const val = eq === -1 ? null : cond.slice(eq + 1)
	const parts = key.split(".")

	if (parts.length < 2) return false

	const section = parts[0]!.toLowerCase()
	// oxlint-disable-next-line typescript/no-explicit-any
	let cur: any = obj
	if (parts.length === 2) {
		const k = parts[1]!.toLowerCase()
		cur = cur[section]?.[k]
	} else {
		const sub = parts.slice(1, -1).join(".")
		const k = parts[parts.length - 1]!.toLowerCase()
		cur = cur[section + ' "' + sub + '"']?.[k]
	}

	if (cur === undefined) return false
	if (val === null) return true

	if (Array.isArray(cur)) {
		for (let i = 0; i < cur.length; i++) {
			if (String(cur[i]) === val) return true
		}
		return false
	}
	return String(cur) === val
}

// oxlint-disable-next-line typescript/no-explicit-any
export function getIncludes(parsed: any, gitDir: string | null, branch: string | null): string[] {
	const order = parsed.__order
	if (!order) {
		const res: string[] = []
		const inc = parsed["include"]
		if (inc?.path) {
			if (Array.isArray(inc.path)) res.push(...inc.path)
			else res.push(inc.path)
		}
		return res
	}

	const res: string[] = []
	const sGD = gitDir ? strip(gitDir) : null
	const gD = sGD ? (sGD.charCodeAt(0) === 47 ? sGD.slice(1) : sGD) : null

	for (let i = 0; i < order.length; i++) {
		const entry = order[i]
		const colon = entry.lastIndexOf(":")
		const sectionName = entry.slice(0, colon)
		const idx = parseInt(entry.slice(colon + 1), 10)

		if (sectionName === "include") {
			res.push(parsed[sectionName].path[idx])
			continue
		}

		if (!gD) continue

		const condition = sectionName.slice(11, -1)
		let matched = false

		if (condition.startsWith("gitdir:")) {
			matched = testPattern(strip(resolveHome(condition.slice(7))), gD, MatchMode.wildmatch)
		} else if (condition.startsWith("gitdir/i:")) {
			matched = testPattern(
				strip(resolveHome(condition.slice(9))),
				gD,
				MatchMode.wildmatch | MatchMode.unsensitive,
			)
		} else if (branch && condition.startsWith("onbranch:")) {
			matched = testPattern(condition.slice(9), branch, MatchMode.wildmatch)
		} else if (condition.startsWith("hasconfig:")) {
			matched = hasConfig(parsed, condition.slice(10))
		}

		if (matched) {
			res.push(parsed[sectionName].path[idx])
		}
	}
	return res
}

// oxlint-disable-next-line typescript/no-explicit-any
const configCacheMap = new WeakMap<FsAdapter, Map<string, any>>()
// oxlint-disable-next-line typescript/no-explicit-any
const mergedConfigCacheMap = new WeakMap<FsAdapter, Map<string, any>>()

// oxlint-disable-next-line typescript/no-explicit-any
export function getCache<K, V>(wm: WeakMap<FsAdapter, Map<K, V>>, fs: FsAdapter): Map<K, V> {
	let m = wm.get(fs)
	if (!m) {
		m = new Map()
		wm.set(fs, m)
	}
	return m
}

export function loadRec(
	fs: FsAdapter,
	path: string,
	gitDir: string | null,
	branch: string | null,
	sig: AbortSignal | null,
	// oxlint-disable-next-line typescript/no-explicit-any
	cb: (c: any) => void,
): void {
	if (sig?.aborted) return cb(null)

	const mCache = getCache(mergedConfigCacheMap, fs)
	const mKey = path + ":" + (gitDir || "") + ":" + (branch || "")
	const mCached = mCache.get(mKey)
	if (mCached !== undefined) return cb(mCached)

	const cache = getCache(configCacheMap, fs)
	const cached = cache.get(path)

	// oxlint-disable-next-line typescript/no-explicit-any
	const processParsed = (parsed: any, includes: string[]) => {
		const len = includes.length
		if (len === 0) return cb(parsed)

		const dir = dirname(path)
		// oxlint-disable-next-line typescript/no-explicit-any
		const results: any[] = Array.from({ length: len })
		let pending = len

		// oxlint-disable-next-line typescript/no-explicit-any
		const merged: any = {}
		mergeConfig(merged, parsed)

		for (let i = 0; i < len; i++) {
			loadRec(fs, resolvePath(dir, includes[i]!), gitDir, branch, sig, (v) => {
				results[i] = v
				if (--pending === 0) {
					for (let j = 0; j < len; j++) {
						if (results[j]) mergeConfig(merged, results[j])
					}
					mCache.set(mKey, merged)
					cb(merged)
				}
			})
		}
	}

	if (cached) return processParsed(cached, getIncludes(cached, gitDir, branch))

	fs.readFile(path, (err, res) => {
		if (err) {
			mCache.set(mKey, null)
			return cb(null)
		}

		const parsed = parseGit(res!.toString())
		cache.set(path, parsed)

		const includes = getIncludes(parsed, gitDir, branch)
		if (includes.length === 0) {
			mCache.set(mKey, parsed)
		}

		processParsed(parsed, includes)
	})
}
