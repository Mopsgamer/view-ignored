import ignore, { Ignore } from "ignore"
import { minimatch } from "minimatch"
import { PatternType } from "./lib.js"

export interface LookerOptions {
	/**
	 * @see {@link Looker.isNegated}
	 */
	negated?: boolean
	patternType?: PatternType
	/**
	 * Git configuration property.
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	ignoreCase?: boolean,
	/**
	 * Additional patterns, which will be used as
	 * other patterns in the `.gitignore` file, or `package.json` "files" property.
	 * @default []
	 */
	addPatterns?: string[],
}
export type LookerPattern = string | string[]
/**
 * The pattern parser. Can check if the file path is ignored.
 */
export class Looker {
	/**
	 * If `true`, when calling {@link Looker.ignores}, method will return `true` for ignored path.
	 * @default false
	 */
	public isNegated: boolean
	/**
	 * Defines way to check paths.
	 * @default ".*ignore"
	 */
	public patternType: PatternType
	public readonly ignoreCase: boolean
	private patternList: string[] = []
	private ignoreInstance: Ignore

	constructor(options?: LookerOptions) {
		this.isNegated = options?.negated ?? false
		this.patternType = options?.patternType ?? ".*ignore"
		this.ignoreCase = options?.ignoreCase ?? false
		this.ignoreInstance = ignore.default(options)
		this.add(options?.addPatterns ?? [])
	}

	clone(): Looker {
		const cloned = new Looker({
			addPatterns: this.patternList,
			negated: this.isNegated,
			patternType: this.patternType,
		})
		return cloned;
	}

	negate(): this {
		this.isNegated = !this.isNegated
		return this
	}

	/**
	 * Adds new ignore rule.
	 * @param pattern .gitignore file specification pattern.
	 */
	add(pattern: LookerPattern): this {
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
	 * Checks if the Looker should ignore dir entry path.
	 * @see {@link Looker.isNegated} can change the return value.
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
	isValidPattern(pattern: LookerPattern): boolean {
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
