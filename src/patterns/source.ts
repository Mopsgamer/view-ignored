import type { Rule, RuleMatch } from "./rule.js"

import { patternCompile, type PatternCompileOptions } from "./patternCompile.js"

/**
 * Represents a source of external patterns.
 *
 * @since 0.6.0
 */
export type Source = {
	/**
	 * @internal
	 *
	 * @since 0.11.0
	 */
	_noMatchCache?: RuleMatch
	/**
	 * Patterns defined within the source file.
	 * Those patterns are for ignoring files.
	 *
	 * @see {@link ruleTest}
	 *
	 * @since 0.11.0
	 */
	rules: Rule[]

	/**
	 * Relative path to the source file.
	 *
	 * @since 0.6.0
	 */
	path: string

	/**
	 * Indicates if the matching logic is inverted.
	 * For example, `package.json` `files` field inverts the matching logic,
	 * because it specifies files to include rather than exclude.
	 *
	 * @see {@link ruleTest}
	 *
	 * @since 0.6.0
	 */
	inverted: boolean
}

/**
 * Converts pattern ("x" (excludes) or "!x" (includes)) to a rule.
 * You can also invert the behavior.
 * It compiles the rule.
 *
 *
 * if !x -> includes + x
 * if x -> excludes + x
 * if invert && !x -> excludes + x
 * if invert && x -> includes + x
 *
 * @since 0.6.0
 */
export function resolveNegatable(
	pattern: string,
	invert: boolean,
	options?: PatternCompileOptions,
	reuse?: Rule,
): Rule {
	// if !x -> includes + x.slice(1)
	// if x -> excludes + x
	// if invert && !x -> excludes + x.slice(1)
	// if invert && x -> includes + x
	const negated = pattern.charCodeAt(0) === 33
	const excludes = negated === invert
	if (negated) pattern = pattern.slice(1)
	const iff = reuse && excludes === reuse.excludes
	const rule: Rule = iff
		? reuse
		: {
				compiled: [patternCompile(pattern, options)],
				excludes,
				pattern: [pattern],
			}
	if (iff) {
		rule.compiled!.push(patternCompile(pattern, options))
		rule.pattern.push(pattern)
	}
	return rule
}
