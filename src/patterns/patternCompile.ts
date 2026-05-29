import type { PatternCache, PatternList } from "./patternMode.js"

import glob from "micromatch"

import { MatchMode } from "./patternMode.js"

/**
 * Compiles a list of patterns into a list of {@link PatternCache} objects.
 *
 * @since 0.6.0
 */
export function patternListCompile(
	list: PatternList,
	mode: MatchMode = MatchMode.normal,
): PatternCache[] {
	const len = list.length
	const res: PatternCache[] = Array.from({ length: len })
	for (let i = 0; i < len; i++) {
		res[i] = patternCompile(list[i]!, list, mode)
	}
	return res
}

/**
 * Checks if a string contains glob magic characters.
 */
function findMagicIndex(s: string, startFrom = 0): number {
	for (let i = startFrom; i < s.length; i++) {
		switch (s.charCodeAt(i)) {
			case 42:
			case 63:
			case 91:
			case 123:
			case 33:
			case 64:
			case 43:
			case 40:
				return i
		}
	}
	return -1
}

/**
 * Internal interface for pattern metadata used during matching.
 */
interface PatternMetadata {
	isLiteral: boolean
	isPrefix: boolean
	isRoot: boolean
	isSimple: boolean
	isSuffix: boolean
	matchBase: boolean
	simplePattern: string
}

/**
 * Compiles a pattern into a {@link PatternCache} object.
 *
 * @since 0.8.0
 */
export function patternCompile(
	pattern: string,
	context: PatternList = [],
	mode: MatchMode = MatchMode.normal,
): PatternCache {
	const isRoot = pattern.charCodeAt(0) === 47 // '/'
	const nocase = !!(mode & MatchMode.unsensitive)

	let cleaned = pattern
	if (cleaned.charCodeAt(cleaned.length - 1) === 47) {
		cleaned = cleaned.slice(0, -1)
	}
	if (isRoot) {
		cleaned = cleaned.slice(1)
	}

	const lowerCleaned = nocase ? cleaned.toLowerCase() : cleaned
	const matchBase = !isRoot && !cleaned.includes("/")

	const magicIdx = findMagicIndex(lowerCleaned)
	let isSimple = magicIdx === -1
	let isSuffix = false
	let isPrefix = false
	let simplePattern = lowerCleaned

	if (!isSimple) {
		if (magicIdx === 0 && lowerCleaned.charCodeAt(0) === 42) {
			// If the first magic char is at index 0, make sure there isn't a second one
			if (findMagicIndex(lowerCleaned, 1) === -1) {
				isSimple = true
				isSuffix = true
				simplePattern = lowerCleaned.slice(1)
			}
		} else if (magicIdx === lowerCleaned.length - 1 && lowerCleaned.charCodeAt(magicIdx) === 42) {
			// If the first magic char is at the very end, it's guaranteed to be the only one
			isSimple = true
			isPrefix = true
			simplePattern = lowerCleaned.slice(0, -1)
		}
	}

	const meta: PatternMetadata = {
		isLiteral: isSimple && !isSuffix && !isPrefix,
		isPrefix,
		isRoot,
		isSimple,
		isSuffix,
		matchBase,
		simplePattern,
	}

	const testFn = createTestFn(lowerCleaned, meta, mode, nocase)

	return {
		meta,
		mode,
		pattern,
		patternContext: context,
		re: { test: testFn },
	}
}

/**
 * Creates the matching function for a pattern.
 */
function createTestFn(
	lowerCleaned: string,
	meta: PatternMetadata,
	mode: MatchMode,
	nocase: boolean,
): (str: string) => boolean {
	if (meta.isSimple) {
		if (mode & MatchMode.wildmatch) {
			return (str: string) => testSimpleWildmatch(str, mode, meta)
		}
		return (str: string) => testSimpleNormal(str, mode, meta)
	}

	const matcherOpts: glob.Options = {
		dot: true,
		matchBase: meta.matchBase,
		nobrace: true,
		nocase,
		nonegate: true,
	}
	let isMatch: ((str: string) => boolean) | undefined
	let wildMatch: ((str: string) => boolean) | undefined

	if (mode & MatchMode.wildmatch) {
		const wm = (wildMatch ||= glob.matcher(lowerCleaned, {
			...matcherOpts,
			nocase: false,
			noextglob: true,
		}))
		return (str: string) => testInternal(getNormalizedString(str, mode), wm, lowerCleaned, meta)
	}

	const im = (isMatch ||= glob.matcher(lowerCleaned, { ...matcherOpts, nocase: false }))
	return (str: string) => testInternal(getNormalizedString(str, mode), im, lowerCleaned, meta)
}

/**
 * Normalizes input string based on match mode.
 */
function getNormalizedString(str: string, mode: MatchMode): string {
	if (mode & MatchMode.unsensitive && !(mode & MatchMode.lowered)) {
		return str.toLowerCase()
	}
	return str
}

/**
 * Core matching logic for simple patterns in non-wildmatch mode.
 */
function testSimpleNormal(str: string, mode: MatchMode, meta: PatternMetadata): boolean {
	const normStr = getNormalizedString(str, mode)
	const { simplePattern, isSuffix, isPrefix, isRoot, matchBase } = meta

	if (isSuffix) {
		if (normStr.endsWith(simplePattern)) {
			if (matchBase) return true
			const pos = normStr.length - simplePattern.length
			if (pos === 0 || normStr.charCodeAt(pos - 1) === 47) return true
		}
	} else if (isPrefix) {
		if (normStr.startsWith(simplePattern)) {
			if (matchBase) return true
			if (
				normStr.length === simplePattern.length ||
				normStr.charCodeAt(simplePattern.length) === 47
			)
				return true
		}
	} else {
		// Literal
		if (
			normStr === simplePattern ||
			(normStr.startsWith(simplePattern) && normStr.charCodeAt(simplePattern.length) === 47)
		) {
			if (isRoot || matchBase) return true
			if (normStr.indexOf("/") === -1) return true
		}
		if (matchBase && testMatchBase(normStr, simplePattern)) return true
	}

	// Traverse up the path for non-rooted non-prefix patterns
	if (!isRoot && !isPrefix) {
		let lastSlash = normStr.lastIndexOf("/")
		while (lastSlash !== -1) {
			const sub = normStr.slice(0, lastSlash)
			if (isSuffix) {
				if (sub.endsWith(simplePattern)) return true
			} else {
				if (sub === simplePattern) return true
			}
			lastSlash = normStr.lastIndexOf("/", lastSlash - 1)
		}
	}

	return false
}

/**
 * Core matching logic for simple patterns in wildmatch mode.
 */
function testSimpleWildmatch(str: string, mode: MatchMode, meta: PatternMetadata): boolean {
	const normStr = getNormalizedString(str, mode)
	const { simplePattern, isSuffix, isPrefix, isRoot, matchBase } = meta

	if (isSuffix) {
		if (normStr.endsWith(simplePattern)) return true
	} else if (isPrefix) {
		if (normStr.startsWith(simplePattern)) return true
	} else {
		if (
			normStr === simplePattern ||
			(normStr.startsWith(simplePattern) && normStr.charCodeAt(simplePattern.length) === 47)
		)
			return true
		if (matchBase && testMatchBase(normStr, simplePattern)) return true
	}

	if (!isRoot) {
		let lastSlash = normStr.lastIndexOf("/")
		while (lastSlash !== -1) {
			const sub = normStr.slice(0, lastSlash)
			if (isSuffix) {
				if (sub.endsWith(simplePattern)) return true
			} else {
				if (sub === simplePattern) return true
			}
			lastSlash = normStr.lastIndexOf("/", lastSlash - 1)
		}
	}
	return false
}

/**
 * Helper to test matchBase (matching file name in any directory).
 */
function testMatchBase(normStr: string, simplePattern: string): boolean {
	const len = simplePattern.length
	let pos = normStr.indexOf(simplePattern)
	while (pos !== -1) {
		if (
			(pos === 0 || normStr.charCodeAt(pos - 1) === 47) &&
			(pos + len === normStr.length || normStr.charCodeAt(pos + len) === 47)
		) {
			return true
		}
		pos = normStr.indexOf(simplePattern, pos + 1)
	}
	return false
}

/**
 * Shared helper for complex glob matching.
 */
function testInternal(
	normStr: string,
	isMatch: (str: string) => boolean,
	cleaned: string,
	meta: PatternMetadata,
): boolean {
	const { isRoot, matchBase } = meta

	if (
		normStr.startsWith(cleaned) &&
		(normStr.length === cleaned.length || normStr.charCodeAt(cleaned.length) === 47)
	) {
		return true
	}

	if (matchBase && testMatchBase(normStr, cleaned)) return true
	if (isMatch(normStr)) return true

	if (!isRoot) {
		let lastSlash = normStr.lastIndexOf("/")
		while (lastSlash !== -1) {
			if (isMatch(normStr.slice(0, lastSlash))) return true
			lastSlash = normStr.lastIndexOf("/", lastSlash - 1)
		}
	}
	return false
}
