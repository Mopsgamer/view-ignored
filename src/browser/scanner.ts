import ignore, {type Ignore} from 'ignore';
import {minimatch} from 'minimatch';

/**
 * Supported matchers/parsers by {@link Scanner}.
 */
export type PatternType = typeof patternTypeList[number];
export const patternTypeList = ['gitignore', 'minimatch'] as const;
export function isPatternType(value: unknown): value is PatternType {
	return typeof value === 'string' && patternTypeList.includes(value as PatternType);
}

/**
 * @see {@link Scanner}
 */
export type ScannerOptions = {
	/**
	 * Use the patterns for including instead of excluding/ignoring.
	 * @default false
	 */
	negated?: boolean;

	/**
	 * The parser for the patterns.
	 * @default "gitignore"
	 */
	patternType?: PatternType;

	/**
	 * Git configuration property.
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	ignoreCase?: boolean;
};

export type IsValidPatternOptions = Pick<ScannerOptions, 'patternType'>;

/**
 * The Glob-like pattern of the specific matcher.
 */
export type ScannerPattern = string | string[];

/**
 * The pattern parser. Can check if the file path is ignored.
 */
export class Scanner {
	/**
	 * Checks if given pattern is valid.
	 * @param pattern Parser pattern.
	 */
	static patternIsValid(pattern: unknown, options?: IsValidPatternOptions): pattern is ScannerPattern {
		const {patternType = 'gitignore'} = options ?? {};

		if (Array.isArray(pattern)) {
			return pattern.every(p => this.patternIsValid(p, options));
		}

		if (typeof pattern !== 'string') {
			return false;
		}

		if (patternType === 'gitignore') {
			return ignore.default.isPathValid(pattern);
		}

		if (patternType === 'minimatch') {
			try {
				minimatch.makeRe(pattern);
				return true;
			} catch {
				return false;
			}
		}

		return false;
	}

	/**
	 * @returns New pattern array: `!pattern` for `pattern`, and `pattern` for `!pattern`.
	 */
	static patternToNegated(pattern: string[]): string[];
	/**
	 * @returns New pattern: `!pattern` for `pattern`, and `pattern` for `!pattern`.
	 */
	static patternToNegated(pattern: string): string;
	static patternToNegated(pattern: ScannerPattern): ScannerPattern {
		if (Array.isArray(pattern)) {
			return pattern.map(p => Scanner.patternToNegated(p));
		}

		return Scanner.patternIsNegated(pattern) ? pattern.replace(/^!/, '') : `!${pattern}`;
	}

	static patternIsNegated(pattern: string): boolean {
		return pattern.startsWith('!');
	}

	private static matchesGitignore(path: string, ignoreInstance: Ignore) {
		return ignoreInstance.ignores(path);
	}

	private static matchesMinimatch(path: string, patternList: string[]) {
		return Array.from(patternList).some(pattern => minimatch(path, pattern, {dot: true}));
	}

	private static matchesReal(instance: Scanner, include: () => boolean, exclude: () => boolean, ignores: () => boolean) {
		if (include()) {
			return false;
		}

		if (exclude()) {
			return true;
		}

		const ign = ignores();
		return instance.isNegated ? !ign : ign;
	}

	/**
	 * If `true`, when calling {@link Scanner.matches}, method will return `true` for ignored path.
	 * @default false
	 */
	public readonly isNegated: boolean = false;

	/**
	 * Defines way to check paths.
	 * @default "gitignore"
	 */
	public readonly patternType: PatternType;

	/**
	 * Git configuration property.
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	public readonly ignoreCase: boolean;
	private readonly patternList = new Set<string>();
	private readonly patternListExclude = new Set<string>();
	private readonly patternListInclude = new Set<string>();
	private readonly ignoreInstance: Ignore;
	private readonly ignoreInstanceExclude: Ignore;
	private readonly ignoreInstanceInclude: Ignore;

	constructor(options?: ScannerOptions) {
		this.patternType = options?.patternType ?? 'gitignore';
		this.ignoreCase = options?.ignoreCase ?? false;
		this.isNegated = options?.negated ?? false;
		this.ignoreInstance = ignore.default(options);
		this.ignoreInstanceExclude = ignore.default(options);
		this.ignoreInstanceInclude = ignore.default(options);
	}

	/**
	 * Adds new ignore rule.
	 * @param pattern .gitignore file specification pattern.
	 */
	add(pattern?: ScannerPattern): this {
		if (typeof pattern === 'string') {
			pattern = pattern.split('\n');
		}

		if (Array.isArray(pattern)) {
			for (const pat of pattern) {
				this.patternList.add(pat);
				this.ignoreInstance.add(pat);
			}
		}

		return this;
	}

	/**
	 * Force ignore pattern.
	 * @param pattern .gitignore file specification pattern.
	 */
	addExclude(pattern?: ScannerPattern): this {
		if (typeof pattern === 'string') {
			pattern = pattern.split('\n');
		}

		if (Array.isArray(pattern)) {
			for (const pat of pattern) {
				this.patternListExclude.add(pat);
				this.ignoreInstanceExclude.add(pat);
			}
		}

		return this;
	}

	/**
	 * Force ignore pattern.
	 * @param pattern .gitignore file specification pattern.
	 */
	addInclude(pattern?: ScannerPattern): this {
		if (typeof pattern === 'string') {
			pattern = pattern.split('\n');
		}

		if (Array.isArray(pattern)) {
			for (const pat of pattern) {
				this.patternListInclude.add(pat);
				this.ignoreInstanceInclude.add(pat);
			}
		}

		return this;
	}

	/**
	 * Checks if the scanner should ignore path.
	 * @see {@link Scanner.isNegated} can change the return value.
	 * @param path Dir entry, path.
	 */
	matches(path: string): boolean {
		if (this.patternType === 'gitignore') {
			return Scanner.matchesReal(this,
				() => Scanner.matchesGitignore(path, this.ignoreInstanceInclude),
				() => Scanner.matchesGitignore(path, this.ignoreInstanceExclude),
				() => Scanner.matchesGitignore(path, this.ignoreInstance),
			);
		}

		// Minimatch
		return Scanner.matchesReal(this,
			() => Scanner.matchesMinimatch(path, Array.from(this.patternListInclude)),
			() => Scanner.matchesMinimatch(path, Array.from(this.patternListExclude)),
			() => Scanner.matchesMinimatch(path, Array.from(this.patternList)),
		);
	}

	/**
	 * Checks if given pattern is valid.
	 * @param pattern Parser pattern.
	 */
	patternIsValid(pattern: unknown): pattern is ScannerPattern {
		return Scanner.patternIsValid(pattern, {patternType: this.patternType});
	}
}
