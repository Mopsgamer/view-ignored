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
function hasMagic(s: string): boolean {
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i)
		// * ? [ { ! @ + (
		if (
			c === 42 ||
			c === 63 ||
			c === 91 ||
			c === 123 ||
			c === 33 ||
			c === 64 ||
			c === 43 ||
			c === 40
		) {
			return true
		}
	}
	return false
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

	let isSimple = !hasMagic(cleaned)
	let isSuffix = false
	let isPrefix = false
	let simplePattern = lowerCleaned

	if (!isSimple) {
		if (lowerCleaned.charCodeAt(0) === 42 && !hasMagic(lowerCleaned.slice(1))) {
			isSimple = true
			isSuffix = true
			simplePattern = lowerCleaned.slice(1)
		} else if (
			lowerCleaned.charCodeAt(lowerCleaned.length - 1) === 42 &&
			!hasMagic(lowerCleaned.slice(0, -1))
		) {
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
		_isLiteral: meta.isLiteral,
		_isPrefix: meta.isPrefix,
		_isRoot: meta.isRoot,
		_isSimple: meta.isSimple,
		_isSuffix: meta.isSuffix,
		_matchBase: meta.matchBase,
		_simplePattern: meta.simplePattern,
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
): (str: string, tMode?: MatchMode) => boolean {
	if (meta.isSimple) {
		return (str: string, tMode: MatchMode = MatchMode.normal) => {
			const currentMode = tMode | mode
			if (currentMode & MatchMode.wildmatch) {
				return testSimpleWildmatch(str, currentMode, tMode, meta)
			}
			return testSimpleNormal(str, currentMode, tMode, meta)
		}
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

	return (str: string, tMode: MatchMode = MatchMode.normal) => {
		const currentMode = tMode | mode
		const normStr = getNormalizedString(str, currentMode, tMode)

		if (currentMode & MatchMode.wildmatch) {
			const wm = (wildMatch ||= glob.matcher(lowerCleaned, {
				...matcherOpts,
				nocase: false,
				noextglob: true,
			}))
			return testInternal(normStr, wm, lowerCleaned, meta)
		}

		const im = (isMatch ||= glob.matcher(lowerCleaned, { ...matcherOpts, nocase: false }))
		return testInternal(normStr, im, lowerCleaned, meta)
	}
}

/**
 * Normalizes input string based on match mode.
 */
function getNormalizedString(str: string, currentMode: MatchMode, tMode: MatchMode): string {
	if (currentMode & MatchMode.unsensitive && !(tMode & MatchMode.lowered)) {
		return str.toLowerCase()
	}
	return str
}

/**
 * Core matching logic for simple patterns in non-wildmatch mode.
 */
function testSimpleNormal(
	str: string,
	currentMode: MatchMode,
	tMode: MatchMode,
	meta: PatternMetadata,
): boolean {
	const normStr = getNormalizedString(str, currentMode, tMode)
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
function testSimpleWildmatch(
	str: string,
	currentMode: MatchMode,
	tMode: MatchMode,
	meta: PatternMetadata,
): boolean {
	const normStr = getNormalizedString(str, currentMode, tMode)
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
