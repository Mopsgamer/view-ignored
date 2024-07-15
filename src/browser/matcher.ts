import ignore, { Ignore } from "ignore"
import { minimatch } from "minimatch"

/**
 * Supported matchers/parsers by {@link PatternMatcher}.
 */
export type PatternType = ".*ignore" | "minimatch"

export interface PatternMatcherOptions {
	/**
	 * @see {@link PatternMatcher.isNegated}
	 */
	negated?: boolean

	/**
	 * The parser for the patterns.
	 */
	patternType?: PatternType

	/**
	 * Git configuration property.
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	ignoreCase?: boolean

	/**
	 * Additional patterns, which will be used as
	 * other patterns in the `.gitignore` file, or `package.json` "files" property.
	 * @default []
	 */
	addPatterns?: string[]
}

/**
 * The Glob-like pattern of the specific matcher.
 */
export type Pattern = string | string[]

/**
 * The pattern parser. Can check if the file path is ignored.
 */
export class PatternMatcher {
	/**
	 * If `true`, when calling {@link PatternMatcher.ignores}, method will return `true` for ignored path.
	 * @default false
	 */
	public isNegated: boolean

	/**
	 * Defines way to check paths.
	 * @default ".*ignore"
	 */
	public patternType: PatternType

	/**
	 * Git configuration property.
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	public readonly ignoreCase: boolean
	private patternList: string[] = []
	private ignoreInstance: Ignore

	constructor(options?: PatternMatcherOptions) {
		this.isNegated = options?.negated ?? false
		this.patternType = options?.patternType ?? ".*ignore"
		this.ignoreCase = options?.ignoreCase ?? false
		this.ignoreInstance = ignore.default(options)
		this.add(options?.addPatterns ?? [])
	}

	/**
	 * Clone instance.
	 */
	clone(): PatternMatcher {
		const cloned = new PatternMatcher({
			addPatterns: this.patternList,
			negated: this.isNegated,
			patternType: this.patternType,
		})
		return cloned;
	}

	/**
	 * Invert checking for the {@link add} method.
	 */
	negate(): this {
		this.isNegated = !this.isNegated
		return this
	}

	/**
	 * Adds new ignore rule.
	 * @param pattern .gitignore file specification pattern.
	 */
	add(pattern: Pattern): this {
		if (typeof pattern === "string") {
			this.patternList.push(pattern)
			this.ignoreInstance.add(pattern)
		} else {
			for (const pat of pattern) {
				this.patternList.push(pat)
				this.ignoreInstance.add(pat)
			}
		}
		return this
	}

	/**
	 * Checks if the matcher should ignore dir entry path.
	 * @see {@link PatternMatcher.isNegated} can change the return value.
	 * @param path Dir entry path.
	 */
	ignores(path: string): boolean {
		let ignores: boolean
		if (this.patternType === ".*ignore") {
			ignores = this.ignoreInstance.ignores(path)
		} else { // minimatch
			ignores = this.patternList.some(pattern => minimatch(path, pattern))
		}
		return this.isNegated ? !ignores : ignores;
	}

	/**
	 * Checks if given pattern is valid.
	 * @param pattern Dir entry path.
	 */
	isValidPattern(pattern: Pattern): boolean {
		if (Array.isArray(pattern)) {
			return pattern.every(p => ignore.default.isPathValid(p))
		}
		if (this.patternType === ".*ignore") {
			return ignore.default.isPathValid(pattern)
		}
		if (this.patternType === "minimatch") {
			try {
				minimatch.makeRe(pattern)
				return true
			} catch (error) {
				return false
			}
		}
		throw new TypeError(`Unknown pattern type '${this.patternType}'.`)
	}
}
