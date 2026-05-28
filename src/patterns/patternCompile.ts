import type { PatternCache, PatternList } from "./patternMode.js"

import glob from "micromatch"

import { MatchMode } from "./patternMode.js"

/**
 * Compiles the {@link PatternList}.
 *
 * @see {@link patternCompile}
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function patternListCompile(
	list: PatternList,
	mode: MatchMode = MatchMode.normal,
): PatternCache[] {
	const len = list.length
	const res = Array.from<PatternCache>({ length: len })
	for (let i = 0; i < len; i++) {
		res[i] = patternCompile(list[i]!, list, mode)
	}
	return res
}

const globSpecialChars = /[*?[\]{}]/
const extGlobChars = /[!@+*?]\(/

/**
 * Compiles a string of the {@link PatternList}.
 *
 * @see {@link patternCompile}
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
	if (cleaned.charCodeAt(cleaned.length - 1) === 47) cleaned = cleaned.slice(0, -1)
	if (isRoot) cleaned = cleaned.slice(1)

	const lowerCleaned = nocase ? cleaned.toLowerCase() : cleaned
	const matchBase = !isRoot && !cleaned.includes("/")

	// Fast path check for simple patterns
	let isSimple = !globSpecialChars.test(cleaned) && !extGlobChars.test(cleaned)
	let isSuffix = false
	let isPrefix = false
	let simplePattern = lowerCleaned

	if (!isSimple) {
		// Check for simple suffix like *.js
		if (
			lowerCleaned.charCodeAt(0) === 42 && // '*'
			!globSpecialChars.test(lowerCleaned.slice(1)) &&
			!extGlobChars.test(lowerCleaned.slice(1))
		) {
			isSimple = true
			isSuffix = true
			simplePattern = lowerCleaned.slice(1)
		} else if (
			lowerCleaned.charCodeAt(lowerCleaned.length - 1) === 42 && // '*'
			!globSpecialChars.test(lowerCleaned.slice(0, -1)) &&
			!extGlobChars.test(lowerCleaned.slice(0, -1))
		) {
			isSimple = true
			isPrefix = true
			simplePattern = lowerCleaned.slice(0, -1)
		}
	}

	const matcherOpts: glob.Options = {
		dot: true,
		matchBase,
		nobrace: true,
		nocase,
		nonegate: true,
	}

	let isMatch: ((str: string) => boolean) | undefined
	let wildMatch: ((str: string) => boolean) | undefined

	const re = {
		test: (str: string, tMode: MatchMode = MatchMode.normal) => {
			const currentMode = tMode | mode
			const isWild = !!(currentMode & MatchMode.wildmatch)
			const useNocase = !!(currentMode & MatchMode.unsensitive)

			if (isSimple && !isWild) {
				return testSimple(
					str,
					simplePattern,
					isRoot,
					useNocase,
					matchBase,
					tMode,
					isSuffix,
					isPrefix,
				)
			}

			if (isWild) {
				const wm = (wildMatch ||= glob.matcher(lowerCleaned, {
					...matcherOpts,
					nocase: false,
					noextglob: true,
				}))
				return test(str, wm, lowerCleaned, isRoot, useNocase, matchBase, tMode)
			}

			const im = (isMatch ||= glob.matcher(lowerCleaned, { ...matcherOpts, nocase: false }))
			return test(str, im, lowerCleaned, isRoot, useNocase, matchBase, tMode)
		},
	}

	return { mode, pattern, patternContext: context, re }
}

function testSimple(
	str: string,
	cleaned: string,
	isRoot: boolean,
	nocase: boolean,
	matchBase: boolean,
	mode: MatchMode,
	isSuffix: boolean,
	isPrefix: boolean,
): boolean {
	const normStr = nocase && !(mode & MatchMode.lowered) ? str.toLowerCase() : str

	if (isSuffix) {
		if (normStr.endsWith(cleaned)) {
			if (matchBase) return true
			// If not matchBase, it must match the whole path or be preceded by a slash
			const pos = normStr.length - cleaned.length
			if (pos === 0 || (isRoot ? false : normStr.charCodeAt(pos - 1) === 47)) return true
		}
	} else if (isPrefix) {
		if (normStr.startsWith(cleaned)) {
			if (matchBase) return true
			// If not matchBase, it must be at the root or preceded by a slash (though prefix is usually root-relative or matchBase)
			// Git logic for prefix*: usually it's either matchBase or root-relative.
			return true
		}
	} else {
		// Exact match or prefix match (directory)
		if (
			normStr.startsWith(cleaned) &&
			(normStr.length === cleaned.length || normStr.charCodeAt(cleaned.length) === 47)
		) {
			if (isRoot || matchBase) return true
			// For non-root, it must be at the start (meaning it's in the root)
			return true
		}

		if (matchBase) {
			const len = cleaned.length
			let pos = normStr.indexOf(cleaned)
			while (pos !== -1) {
				if (
					(pos === 0 || normStr.charCodeAt(pos - 1) === 47) &&
					(pos + len === normStr.length || normStr.charCodeAt(pos + len) === 47)
				) {
					return true
				}
				pos = normStr.indexOf(cleaned, pos + 1)
			}
		}
	}

	if (!isRoot && !isPrefix) {
		let lastSlash = normStr.lastIndexOf("/")
		while (lastSlash !== -1) {
			const sub = normStr.slice(0, lastSlash)
			if (isSuffix) {
				if (sub.endsWith(cleaned)) return true
			} else {
				if (sub === cleaned) return true
			}
			lastSlash = normStr.lastIndexOf("/", lastSlash - 1)
		}
	}

	return false
}

function test(
	str: string,
	isMatch: (str: string) => boolean,
	cleaned: string,
	isRoot: boolean,
	nocase: boolean,
	matchBase: boolean,
	mode: MatchMode,
): boolean {
	const normStr = nocase && !(mode & MatchMode.lowered) ? str.toLowerCase() : str

	if (
		normStr.startsWith(cleaned) &&
		(normStr.length === cleaned.length || normStr.charCodeAt(cleaned.length) === 47)
	) {
		return true
	}

	if (matchBase) {
		const len = cleaned.length
		let pos = normStr.indexOf(cleaned)
		while (pos !== -1) {
			if (
				(pos === 0 || normStr.charCodeAt(pos - 1) === 47) &&
				(pos + len === normStr.length || normStr.charCodeAt(pos + len) === 47)
			) {
				return true
			}
			pos = normStr.indexOf(cleaned, pos + 1)
		}
	}

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
