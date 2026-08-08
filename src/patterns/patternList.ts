import glob from "picomatch"

/**
 * @since 0.8.0
 */
export type PatternCompileOptions = {
	/**
	 * Disables case sensitivity.
	 *
	 * @default false
	 *
	 * @since 0.8.0
	 */
	nocase?: boolean
	/**
	 * The list of patterns to use as context for matching.
	 *
	 * @default []
	 *
	 * @since 0.12.0
	 */
	list?: PatternList
}

/**
 * Represents a list of positive glob patterns.
 *
 * @since 0.6.0
 */
export type PatternList = string[]

/**
 * Compiles the {@link PatternList}.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function patternListCompile(options: PatternCompileOptions & { list: PatternList }): {
	re: { test(string: string, lowerPath?: string): boolean }
	pattern: string
	list: PatternList
	compiledItems?: { pattern: string; re: RegExp }[]
} {
	const nocase = !!options.nocase
	const { list } = options
	const len = list.length

	if (len === 0) {
		return {
			list,
			pattern: "",
			re: {
				test: () => false,
			},
		}
	}

	const patternSources: string[] = new Array(len)
	const compiledItems: { pattern: string; re: RegExp }[] = new Array(len)

	for (let i = 0; i < len; i++) {
		const pattern = list[i]!
		const isRoot = pattern.startsWith("/")
		const isRelative = pattern.startsWith("./")
		const isAnchored = isRoot || isRelative

		let cleaned = pattern
		if (isRelative) cleaned = cleaned.slice(2)
		// 47 is char code for '/'
		if (cleaned.charCodeAt(cleaned.length - 1) === 47) cleaned = cleaned.slice(0, -1)
		if (isRoot) cleaned = cleaned.slice(1)

		const lowerCleaned = nocase ? cleaned.toLowerCase() : cleaned

		let part = ""
		let isGlob = false
		const clen = cleaned.length
		for (let j = 0; j < clen; j++) {
			const c = cleaned.charCodeAt(j)
			if (c === 42 || c === 63 || c === 91 || c === 40 || c === 41 || c === 33) {
				isGlob = true
				break
			}
		}

		if (isGlob) {
			const isMatchRe = glob.makeRe(lowerCleaned, {
				contains: true,
				dot: true,
				matchBase: false,
				nobrace: true,
				nocase,
				nonegate: true,
			})
			part = isMatchRe.source
			if (part.startsWith("^") && part.endsWith("$")) {
				part = part.slice(1, -1)
			}
		} else {
			part = lowerCleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		}

		const source = (isAnchored ? "^" : "(?:^|\\/)") + part + "(?:\\/|$)"
		patternSources[i] = source

		compiledItems[i] = {
			pattern,
			re: new RegExp(source, nocase ? "i" : ""),
		}
	}

	const combinedSource = patternSources.join("|")
	const combinedRegex = new RegExp(combinedSource, nocase ? "i" : "")

	const re = {
		test(str: string, lowerPath?: string): boolean {
			const n = nocase ? lowerPath || str.toLowerCase() : str
			return combinedRegex.test(n)
		},
	}

	return {
		compiledItems,
		list,
		pattern: list.join(","),
		re,
	}
}
