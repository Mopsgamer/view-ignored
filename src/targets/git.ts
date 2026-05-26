import type { Target } from "./target.js"
import * as ini from "ini"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	type Rule,
	extractGitignore,
	patternCompile,
} from "../patterns/index.js"
import { dirname, join, unixify } from "../unixify.js"
import type { FsAdapter } from "../types.js"

const extractors: Extractor[] = [
	{ extract: extractGitignore, path: ".gitignore" },
	{ extract: extractGitignore, path: ".git/info/exclude" },
]

const env = typeof process !== "undefined" ? process.env : {}
const HOME = (env.HOME || env.USERPROFILE || "").replaceAll("\\", "/")
const XDG = (env.XDG_CONFIG_HOME || (HOME ? HOME + "/.config" : "")).replaceAll("\\", "/")

const resH = (p: string) => (p.startsWith("~/") ? join(HOME, p.substring(2)) : p)

const resP = (base: string, p: string) => {
	p = resH(p)
	return p.startsWith("/") || p.includes(":") ? p : join(base, p.startsWith("./") ? p.substring(2) : p)
}

function gitMatches(pattern: string, gitDir: string): boolean {
	pattern = resH(pattern)
	if (pattern.endsWith("/")) pattern += "**"
	if (!pattern.startsWith("/") && !pattern.startsWith("./") && !pattern.startsWith("**/")) {
		pattern = "**/" + pattern
	}
	return patternCompile(pattern).re.test(gitDir.startsWith("/") ? gitDir.substring(1) : gitDir, {})
}

function findKey(obj: any, key: string) {
	if (!obj) return
	const k = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase())
	return k ? obj[k] : undefined
}

function merge(target: any, source: any) {
	for (const k in source) {
		const v = source[k]
		const tk = Object.keys(target).find((i) => i.toLowerCase() === k.toLowerCase()) || k
		if (v && typeof v === "object" && !Array.isArray(v)) {
			if (!target[tk]) target[tk] = {}
			merge(target[tk], v)
		} else target[tk] = v
	}
}

function getInc(parsed: any, gitDir: string | null): string[] {
	const res: string[] = []
	const add = (p: any) => (Array.isArray(p) ? res.push(...p) : typeof p === "string" && res.push(p))
	add(findKey(findKey(parsed, "include"), "path"))
	if (!gitDir) return res
	for (const s in parsed) {
		if (s.toLowerCase().startsWith('includeif "')) {
			const c = s.substring(11, s.length - 1)
			if (c.startsWith("gitdir:") && gitMatches(c.substring(7), gitDir)) {
				add(findKey(parsed[s], "path"))
			}
		}
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
	fs.readFile(path, (err, res) => {
		if (err) return cb(null)
		const p = ini.parse(res!.toString().replace(/^[ \t]*path\s*=/gm, "path[]="))
		const inc = getInc(p, gitDir)
		if (!inc.length) return cb(p)
		const dir = dirname(path)
		let i = 0
		const next = () => {
			if (i >= inc.length) return cb(p)
			loadRec(fs, resP(dir, inc[i++]!), gitDir, sig, (c) => {
				if (c) merge(p, c)
				next()
			})
		}
		next()
	})
}

function findGit(fs: FsAdapter, cur: string, cb: (g: string | null) => void) {
	fs.readdir(cur, (err, files) => {
		if (!err && (files as string[]).includes(".git")) return cb(join(cur, ".git"))
		const p = dirname(cur)
		if (p === cur || !cur || cur === ".") return cb(null)
		findGit(fs, p, cb)
	})
}

function done(conf: any, gDir: string | null, cwd: string, fs: FsAdapter, target: Target, cb: () => void) {
	let ex = findKey(findKey(conf, "core"), "excludesfile")
	if (!ex) ex = XDG ? join(XDG, "git/ignore") : join(HOME, ".config/git/ignore")
	const i: Rule = { compiled: null, excludes: false, pattern: [] }
	const e: Rule = { compiled: null, excludes: true, pattern: [] }
	const finish = () => {
		target.internalRules = [
			ruleCompile({ compiled: null, excludes: true, pattern: [".git", ".DS_Store"] }),
			ruleCompile(i),
			ruleCompile(e),
		]
		cb()
	}
	fs.readFile(resP(gDir || cwd, ex), (err, res) => {
		if (!err && res) {
			const d: any = { rules: [] }
			extractGitignore(d, res)
			for (const r of d.rules) (r.excludes ? e : i).pattern.push(...r.pattern)
		}
		finish()
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
			const confs: string[] = []
			if (HOME) confs.push(join(HOME, ".gitconfig"))
			if (XDG) confs.push(join(XDG, "git/config"))
			if (gDir) {
				confs.push(join(gDir, "config"))
				target.root = dirname(gDir)
			}
			const m: any = {}
			const next = () => {
				if (!confs.length) return done(m, gDir, nCwd, fs, target, cb)
				loadRec(fs, confs.shift()!, gDir, signal, (c) => {
					if (c) merge(m, c)
					next()
				})
			}
			next()
		})
	},
	internalRules: [ruleCompile({ compiled: null, excludes: true, pattern: [".git", ".DS_Store"] })],
	root: "/",
}
