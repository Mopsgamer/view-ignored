import ignore, { Ignore } from "ignore"
import { minimatch } from "minimatch"

/**
 * Supported matchers/parsers by {@link Scanner}.
 */
export type PatternType = typeof patternTypeList[number]
export const patternTypeList = [".*ignore", "minimatch"] as const
export function isPatternType(value: unknown): value is PatternType {
	return typeof value === "string" && patternTypeList.includes(value as PatternType)
}

/**
 * @see {@link Scanner}
 */
export interface ScannerOptions {
	/**
	 * The root directory.
	 * @default process.cwd()
	 */
	cwd?: string

	/**
	 * If `true`, when calling {@link Scanner.matches}, method will return `true` for ignored path.
	 * @see {@link Scanner.isNegated}
	 * @default ".*ignore"
	 */
	negated?: boolean

	/**
	 * The parser for the patterns.
	 * @default ".*ignore"
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

export type IsValidPatternOptions = Pick<ScannerOptions, "patternType">

/**
 * The Glob-like pattern of the specific matcher.
 */
export type ScannerPattern = string | string[]

/**
 * The pattern parser. Can check if the file path is ignored.
 */
export class Scanner {

	/**
	 * The root directory.
	 * @default process.cwd()
	 */
	public cwd: string

	/**
	 * If `true`, when calling {@link Scanner.matches}, method will return `true` for ignored path.
	 * @default false
	 */
	public isNegated: boolean

	/**
	 * Defines way to check paths.
	 * @default ".*ignore"
	 */
	public readonly patternType: PatternType

	/**
	 * Git configuration property.
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	public readonly ignoreCase: boolean
	private patternList: Set<string> = new Set()
	private patternListExclude: Set<string> = new Set()
	private patternListInclude: Set<string> = new Set()
	private ignoreInstance: Ignore
	private ignoreInstanceExclude: Ignore
	private ignoreInstanceInclude: Ignore

	constructor(options?: ScannerOptions) {
		this.isNegated = options?.negated ?? false
		this.patternType = options?.patternType ?? ".*ignore"
		this.ignoreCase = options?.ignoreCase ?? false
		this.cwd = options?.cwd ?? process.cwd()
		this.ignoreInstance = ignore.default(options)
		this.ignoreInstanceExclude = ignore.default(options)
		this.ignoreInstanceInclude = ignore.default(options)
		this.add(options?.addPatterns ?? [])
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
	add(pattern: ScannerPattern): this {
		if (typeof pattern === "string") {
			pattern = pattern.split('\n')
		}
		if (Array.isArray(pattern)) {
			for (const pat of pattern) {
				this.patternList.add(pat)
				this.ignoreInstance.add(pat)
			}
		}
		return this
	}

	/**
	 * Force ignore pattern.
	 * @param pattern .gitignore file specification pattern.
	 */
	exclude(pattern: ScannerPattern): this {
		if (typeof pattern === "string") {
			pattern = pattern.split('\n')
		}
		if (Array.isArray(pattern)) {
			for (const pat of pattern) {
				this.patternListExclude.add(pat)
				this.ignoreInstanceExclude.add(pat)
			}
		}
		return this
	}

	/**
	 * Force ignore pattern.
	 * @param pattern .gitignore file specification pattern.
	 */
	include(pattern: ScannerPattern): this {
		if (typeof pattern === "string") {
			pattern = pattern.split('\n')
		}
		if (Array.isArray(pattern)) {
			for (const pat of pattern) {
				this.patternListInclude.add(pat)
				this.ignoreInstanceInclude.add(pat)
			}
		}
		return this
	}

	/**
	 * Checks if the scanner should ignore path.
	 * @see {@link Scanner.isNegated} can change the return value.
	 * @param path Dir entry, path.
	 */
	matches(path: string): boolean {
		if (this.patternType === ".*ignore") {
			return this.matchesReal(
				() => Scanner.matchesGitignore(path, this.ignoreInstanceInclude),
				() => Scanner.matchesGitignore(path, this.ignoreInstanceExclude),
				() => Scanner.matchesGitignore(path, this.ignoreInstance)
			)
		}

		// minimatch
		return this.matchesReal(
			() => Scanner.matchesMinimatch(path, Array.from(this.patternListInclude)),
			() => Scanner.matchesMinimatch(path, Array.from(this.patternListExclude)),
			() => Scanner.matchesMinimatch(path, Array.from(this.patternList))
		)
	}

	private matchesReal(include: () => boolean, exclude: () => boolean, ignores: () => boolean) {
		if (include()) {
			return false
		}
		if (exclude()) {
			return true
		}
		const ign = ignores()
		return this.isNegated ? !ign : ign
	}

	private static matchesGitignore(path: string, ignoreInstance: Ignore) {
		return ignoreInstance.ignores(path)
	}

	private static matchesMinimatch(path: string, patternList: string[]) {
		return Array.from(patternList).some((pattern) => {
			return minimatch(path, pattern, { dot: true })
		})
	}

	/**
	 * Checks if given pattern is valid.
	 * @param pattern Parser pattern.
	 */
	patternIsValid(pattern: unknown): pattern is ScannerPattern {
		return Scanner.patternIsValid(pattern, this)
	}

	/**
	 * Checks if given pattern is valid.
	 * @param pattern Parser pattern.
	 */
	static patternIsValid(pattern: unknown, options?: IsValidPatternOptions): pattern is ScannerPattern {
		const { patternType = ".*ignore" } = options ?? {};

		if (Array.isArray(pattern)) {
			return pattern.every(p => this.patternIsValid(p, options))
		}
		if (typeof pattern !== "string") {
			return false
		}
		if (patternType === ".*ignore") {
			return ignore.default.isPathValid(pattern)
		}
		if (patternType === "minimatch") {
			try {
				minimatch.makeRe(pattern)
				return true
			} catch (error) {
				return false
			}
		}
		throw new TypeError(`Unknown pattern type '${patternType}'.`)
	}

	/**
	 * @returns New pattern array: `!pattern` for `pattern`, and `pattern` for `!pattern`.
	 */
	static patternToNegated(pattern: string[]): string[]
	/**
	 * @returns New pattern: `!pattern` for `pattern`, and `pattern` for `!pattern`.
	 */
	static patternToNegated(pattern: string): string
	static patternToNegated(pattern: ScannerPattern): ScannerPattern {
		if (Array.isArray(pattern)) {
			return pattern.map(Scanner.patternToNegated) as string[]
		}

		return Scanner.patternIsNegated(pattern) ? pattern.replace(/^!/, '') : `!${pattern}`
	}

	static patternIsNegated(pattern: string): boolean {
		return pattern.startsWith('!')
	}
}
