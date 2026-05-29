import type { PatternCache, PatternList } from "./patternMode.js"

import glob from "micromatch"

import { MatchMode } from "./patternMode.js"

export function patternListCompile(list: PatternList, mode: MatchMode = MatchMode.normal): PatternCache[] {
	const len = list.length
	const res = new Array(len)
	for (let i = 0; i < len; i++) res[i] = patternCompile(list[i]!, list, mode)
	return res
}

const globSpecialChars = /[*?[\]{}]/
const extGlobChars = /[!@+*?]\(/

export function patternCompile(pattern: string, context: PatternList = [], mode: MatchMode = MatchMode.normal): PatternCache {
	const isRoot = pattern.charCodeAt(0) === 47 // '/'
	const nocase = !!(mode & MatchMode.unsensitive)

	let cleaned = pattern
	if (cleaned.charCodeAt(cleaned.length - 1) === 47) cleaned = cleaned.slice(0, -1)
	if (isRoot) cleaned = cleaned.slice(1)

	const lowerCleaned = nocase ? cleaned.toLowerCase() : cleaned
	const matchBase = !isRoot && !cleaned.includes("/")

	let isSimple = !globSpecialChars.test(cleaned) && !extGlobChars.test(cleaned)
	let isSuffix = false
	let isPrefix = false
	let simplePattern = lowerCleaned

	if (!isSimple) {
		if (lowerCleaned.charCodeAt(0) === 42 && !globSpecialChars.test(lowerCleaned.slice(1)) && !extGlobChars.test(lowerCleaned.slice(1))) {
			isSimple = true
			isSuffix = true
			simplePattern = lowerCleaned.slice(1)
		} else if (lowerCleaned.charCodeAt(lowerCleaned.length - 1) === 42 && !globSpecialChars.test(lowerCleaned.slice(0, -1)) && !extGlobChars.test(lowerCleaned.slice(0, -1))) {
			isSimple = true
			isPrefix = true
			simplePattern = lowerCleaned.slice(0, -1)
		}
	}

	const matcherOpts: glob.Options = { dot: true, matchBase, nobrace: true, nocase, nonegate: true }

	let isMatch: ((str: string) => boolean) | undefined
	let wildMatch: ((str: string) => boolean) | undefined

	const re = {
		test: (str: string, tMode: MatchMode = MatchMode.normal) => {
			const currentMode = tMode | mode
			const useNocase = !!(currentMode & MatchMode.unsensitive)
			const normStr = useNocase && !(tMode & MatchMode.lowered) ? str.toLowerCase() : str

			if (isSimple && !(currentMode & MatchMode.wildmatch)) {
				if (isSuffix) {
					if (normStr.endsWith(simplePattern)) {
						if (matchBase) return true
						const pos = normStr.length - simplePattern.length
						if (pos === 0 || normStr.charCodeAt(pos - 1) === 47) return true
					}
				} else if (isPrefix) {
					if (normStr.startsWith(simplePattern)) {
						if (matchBase) return true
						if (normStr.length === simplePattern.length || normStr.charCodeAt(simplePattern.length) === 47) return true
					}
				} else {
					if (normStr.startsWith(simplePattern) && (normStr.length === simplePattern.length || normStr.charCodeAt(simplePattern.length) === 47)) {
						if (isRoot || matchBase) return true
						if (normStr.indexOf("/") === -1) return true
					}
					if (matchBase) {
						const len = simplePattern.length
						let pos = normStr.indexOf(simplePattern)
						while (pos !== -1) {
							if ((pos === 0 || normStr.charCodeAt(pos - 1) === 47) && (pos + len === normStr.length || normStr.charCodeAt(pos + len) === 47)) return true
							pos = normStr.indexOf(simplePattern, pos + 1)
						}
					}
				}
				if (!isRoot && !isPrefix) {
					let lastSlash = normStr.lastIndexOf("/")
					while (lastSlash !== -1) {
						const sub = normStr.slice(0, lastSlash)
						if (isSuffix) { if (sub.endsWith(simplePattern)) return true }
						else { if (sub === simplePattern) return true }
						lastSlash = normStr.lastIndexOf("/", lastSlash - 1)
					}
				}
				return false
			}

			if (currentMode & MatchMode.wildmatch) {
				const wm = (wildMatch ||= glob.matcher(lowerCleaned, { ...matcherOpts, nocase: false, noextglob: true }))
				return testInternal(normStr, wm, lowerCleaned, isRoot, matchBase)
			}

			const im = (isMatch ||= glob.matcher(lowerCleaned, { ...matcherOpts, nocase: false }))
			return testInternal(normStr, im, lowerCleaned, isRoot, matchBase)
		},
	}

	return {
		mode, pattern, patternContext: context, re,
		_isSimple: isSimple,
		_isSuffix: isSuffix,
		_isPrefix: isPrefix,
		_simplePattern: simplePattern,
		_isLiteral: isSimple && !isSuffix && !isPrefix,
		_isRoot: isRoot,
		_matchBase: matchBase
	} as any
}

function testInternal(normStr: string, isMatch: (str: string) => boolean, cleaned: string, isRoot: boolean, matchBase: boolean): boolean {
	if (normStr.startsWith(cleaned) && (normStr.length === cleaned.length || normStr.charCodeAt(cleaned.length) === 47)) return true
	if (matchBase) {
		const len = cleaned.length
		let pos = normStr.indexOf(cleaned)
		while (pos !== -1) {
			if ((pos === 0 || normStr.charCodeAt(pos - 1) === 47) && (pos + len === normStr.length || normStr.charCodeAt(pos + len) === 47)) return true
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
