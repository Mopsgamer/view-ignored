import type { Resource } from "./resource.js"
import type { GlobRule, Rule, RuleMatch } from "./rule.js"

/**
 * Represents a source of external patterns.
 *
 * @since 0.6.0
 */
export type Source = {
	/**
	 * Parent source for hierarchical ignore file rules.
	 *
	 * @since 0.12.0
	 */
	parent?: Resource
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

	/**
	 * Directory where the source was located.
	 *
	 * @since 0.12.0
	 */
	dir?: string
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
export function resolveNegatable(pattern: string, invert: boolean, reuse?: GlobRule): GlobRule {
	const isEscapedBang =
		pattern.length > 1 && pattern.charCodeAt(0) === 92 && pattern.charCodeAt(1) === 33
	let negated = false
	if (isEscapedBang) {
		pattern = pattern.slice(1)
	} else if (pattern.charCodeAt(0) === 33) {
		negated = true
		pattern = pattern.slice(1)
	}
	const excludes = negated === invert
	const iff = reuse && excludes === reuse.excludes
	const rule: GlobRule = iff ? reuse : { compiled: null, excludes, list: [] }
	rule.list.push(pattern)
	return rule
}
