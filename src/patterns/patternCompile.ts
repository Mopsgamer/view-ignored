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

	const matcherOpts: glob.Options = {
		dot: true,
		matchBase,
		nobrace: true,
		nocase,
		nonegate: true,
	}

	const isMatch = glob.matcher(lowerCleaned, { ...matcherOpts, nocase: false })

	let wildMatch: ((str: string) => boolean) | undefined

	const re = {
		test: (str: string, tMode: MatchMode = MatchMode.normal) => {
			if ((tMode | mode) & MatchMode.wildmatch) {
				const wm = (wildMatch ||= glob.matcher(lowerCleaned, {
					...matcherOpts,
					nocase: false,
					noextglob: true,
				}))
				return test(str, wm, lowerCleaned, isRoot, nocase, matchBase, tMode)
			}
			return test(str, isMatch, lowerCleaned, isRoot, nocase, matchBase, tMode)
		},
	}

	return { mode, pattern, patternContext: context, re }
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

	if (normStr === cleaned || normStr.startsWith(cleaned + "/")) {
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
