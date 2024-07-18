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

export interface ScannerOptions {
	/**
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
	 * If `true`, when calling {@link Scanner.ignores}, method will return `true` for ignored path.
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

	constructor(options?: ScannerOptions) {
		this.isNegated = options?.negated ?? false
		this.patternType = options?.patternType ?? ".*ignore"
		this.ignoreCase = options?.ignoreCase ?? false
		this.ignoreInstance = ignore.default(options)
		this.add(options?.addPatterns ?? [])
	}

	/**
	 * Clone instance.
	 */
	clone(): Scanner {
		const cloned = new Scanner({
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
	add(pattern: ScannerPattern): this {
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
	 * @see {@link Scanner.isNegated} can change the return value.
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
	 * @param pattern Parser pattern.
	 */
	isValidPattern(pattern: unknown): boolean {
		return Scanner.isValidPattern(pattern, this)
	}

	/**
	 * Checks if given pattern is valid.
	 * @param pattern Parser pattern.
	 */
	static isValidPattern(pattern: unknown, options?: IsValidPatternOptions): boolean {
		const { patternType = ".*ignore" } = options ?? {};

		if (Array.isArray(pattern)) {
			return pattern.every(p => this.isValidPattern(p, options))
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
}
