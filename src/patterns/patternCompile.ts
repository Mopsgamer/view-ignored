import glob from "micromatch"

import type { PatternCache, PatternList } from "./patternList.js"

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
	options?: PatternCompileOptions,
): PatternCache {
	const original = pattern
	const isRoot = pattern.startsWith("/")
	const nocase = !!options?.nocase

	let cleaned = pattern
	if (cleaned.endsWith("/")) cleaned = cleaned.slice(0, -1)
	if (isRoot) cleaned = cleaned.slice(1)

	const lowerCleaned = nocase ? cleaned.toLowerCase() : cleaned
	const prefix = lowerCleaned + "/"
	const hasGlob = cleaned.includes("*")

	const matchBase = !isRoot && !cleaned.includes("/")

	const matcherOpts = {
		dot: true,
		nonegate: true,
		nocomment: true,
		nobrace: true,
		nocase,
		matchBase,
		optimizationLevel: 2,
	}

	const re = {
		test(str: string): boolean {
			const lowerStr = nocase ? str.toLowerCase() : str

			if (lowerStr === lowerCleaned || lowerStr.startsWith(prefix)) {
				return true
			}

			if (matchBase) {
				if (str.includes(cleaned)) {
					const segments = str.split("/")
					for (const seg of segments) {
						if (seg === lowerCleaned) return true
					}
				}
			}

			if (hasGlob) {
				if (glob.isMatch(str, cleaned, matcherOpts)) return true

				// Check parents only if there's a glob
				let lastSlash = str.lastIndexOf("/")
				while (lastSlash !== -1) {
					const parent = str.substring(0, lastSlash)
					if (glob.isMatch(parent, cleaned, matcherOpts)) return true
					lastSlash = str.lastIndexOf("/", lastSlash - 1)
				}
			}

			return false
		},
	}

	return { re, pattern: original, patternContext: context }
}
