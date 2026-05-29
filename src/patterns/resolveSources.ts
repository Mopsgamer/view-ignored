import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import type { Extractor, PatternFinderOptions } from "./extractor.js"
import type { Resource } from "./resource.js"
import type { Rule } from "./rule.js"
import type { Source } from "./source.js"

import { join } from "../unixify.js"
import { patternListCompile } from "./patternCompile.js"
import { MatchMode } from "./patternMode.js"

export function ruleCompile(rule: Rule, mode: MatchMode = MatchMode.normal): Rule {
	rule.compiled = patternListCompile(rule.pattern, mode)
	const literals = new Set<string>()
	let hasComplex = false
	for (let i = 0; i < rule.compiled.length; i++) {
		const r = rule.compiled[i]! as any
		if (r._isLiteral && !r._matchBase && !r._isRoot) literals.add(r._simplePattern)
		else hasComplex = true
	}
	if (literals.size > 0 && !hasComplex) rule._literals = literals
	else delete rule._literals
	return rule
}

export interface ResolveSourcesOptions extends PatternFinderOptions {
	dir: string
	external: Map<string, Resource>
}

export function resolveSources(
	options: ResolveSourcesOptions,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const { fs, external, cwd, signal, target, resource: parentResource } = options
	const dir = options.dir

	if (target.root === "." && dir !== ".") {
		let res = external.get(".")
		if (res !== undefined) {
			external.set(dir, res)
			return cb(null, res)
		}
		return resolveSources({ ...options, dir: "." }, (err, res) => {
			if (err) return cb(err, null as any)
			external.set(dir, res)
			cb(null, res)
		})
	}

	let source = external.get(dir)
	if (source !== undefined) return cb(null, source)

	const noSourceDirList: string[] = [dir]
	let d = dir
	while (d !== ".") {
		const lastSlash = d.lastIndexOf("/")
		d = lastSlash === -1 ? "." : d.slice(0, lastSlash)
		source = external.get(d)
		if (source !== undefined) break
		noSourceDirList.push(d)
	}

	if (target.root.charCodeAt(0) === 47) {
		const segments = cwd.split("/")
		const preCwdSegments: string[] = []
		let current = ""
		for (let i = 0, len = segments.length - 1; i < len; i++) {
			current += segments[i] + "/"
			const path = current.length > 1 ? current.slice(0, -1) : "/"
			if (path.length >= target.root.length) preCwdSegments.push(path)
		}

		return findSourceForAbsoluteDirsCb(preCwdSegments, fs, target, signal, (err, source) => {
			if (err) return cb(err, null)
			const len = noSourceDirList.length
			const absPaths: string[] = Array.from({ length: len })
			for (let i = 0; i < len; i++) {
				absPaths[i] = join(cwd, noSourceDirList[i]!)
			}
			findSourceForAbsoluteDirsCb(absPaths, fs, target, signal, (err, s) => {
				if (err) return cb(err, null)
				const finalSource = s || source || parentResource || null
				external.set(dir, finalSource)
				cb(null, finalSource)
			})
		})
	}

	const len = noSourceDirList.length
	const absPaths: string[] = Array.from({ length: len })
	for (let i = 0; i < len; i++) absPaths[i] = join(cwd, noSourceDirList[i]!)
	findSourceForAbsoluteDirsCb(absPaths, fs, target, signal, (err, source) => {
		if (err) return cb(err, null)
		const finalSource = source || parentResource || null
		external.set(dir, finalSource)
		cb(null, finalSource)
	})
}

function findSourceForAbsoluteDirsCb(
	paths: string[],
	fs: FsAdapter,
	target: Target,
	signal: AbortSignal | null,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const extractors = target.extractors
	const plen = paths.length
	const elen = extractors.length
	let i = 0
	let j = 0
	function next() {
		if (i >= plen) return cb(null, null)
		if (signal?.aborted) return cb(signal.reason, null)
		const parent = paths[i]!
		const extractor = extractors[j]!
		j++
		if (j >= elen) {
			i++
			j = 0
		}
		tryExtractorCb(parent, fs, extractor, (err, source) => {
			if (err) return cb(err, null)
			if (source !== null) return cb(null, source)
			next()
		})
	}
	next()
}

function tryExtractorCb(
	cwd: string,
	fs: FsAdapter,
	extractor: Extractor,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const abs = join(cwd, extractor.path)
	fs.readFile(abs, (err, buff) => {
		if (err) {
			if ((err as any).code === "ENOENT") return cb(null, null)
			return cb(null, {
				error: err as any,
				source: { inverted: false, path: extractor.path, rules: [] },
			})
		}
		const newSource = <Source>{ inverted: false, path: extractor.path, rules: [] }
		const act = extractor.extract(newSource, buff!)
		if (act === null) return cb(null, null)
		if (act instanceof Error) return cb(null, { error: act, source: newSource })
		cb(null, newSource)
	})
}
