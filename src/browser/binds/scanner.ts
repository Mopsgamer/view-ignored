import {minimatch} from 'minimatch';
import {gitignoreToMinimatch} from '@humanwhocodes/gitignore-to-minimatch';
import {type Scanner} from '../lib.js';

/**
 * @public
 */
export type PatternScannerOptions = {
	pattern?: string | string[];
	exclude?: string | string[];
	include?: string | string[];
	negated?: boolean;
};

/**
 * @public
 */
export type PatternScanner = Scanner & {
	pattern: string | string[];
	exclude: string | string[];
	include: string | string[];
	negated: boolean;
	isValid(value: unknown): value is string | string[];
	ignores(path: string, pattern: string | string[]): boolean;
	ignores(path: string, options?: PatternScannerOptions): boolean;
	ignores(path: string, argument?: PatternScannerOptions | string | string[]): boolean;
};

/**
 * @public
 */
export class ScannerMinimatch implements PatternScanner {
	public negated: boolean;
	protected _pattern: string | string[];
	get pattern() {
		return this._pattern;
	}

	set pattern(value: string | string[]) {
		this._pattern = value;
	}

	protected _exclude: string | string[];
	get exclude(): string | string[] {
		return this._exclude;
	}

	set exclude(value: string | string[]) {
		this._exclude = value;
	}

	protected _include: string | string[];
	get include(): string | string[] {
		return this._include;
	}

	set include(value: string | string[]) {
		this._include = value;
	}

	constructor(options?: PatternScannerOptions) {
		this._pattern = options?.pattern ?? [];
		this._exclude = options?.exclude ?? [];
		this._include = options?.include ?? [];
		this.negated = options?.negated ?? false;
	}

	isValid(value: unknown): value is string | string[] {
		if (Array.isArray(value)) {
			return value.every(p => !Array.isArray(p) && this.isValid(value));
		}

		if (typeof value !== 'string') {
			return false;
		}

		try {
			minimatch.makeRe(value);
			return true;
		} catch {
			return false;
		}
	}

	ignores(path: string, pattern: string | string[]): boolean;
	ignores(path: string, options?: PatternScannerOptions): boolean;
	ignores(path: string, argument?: PatternScannerOptions | string | string[]): boolean {
		if (Array.isArray(argument)) {
			argument = argument.join('\n');
		}

		if (typeof argument === 'string') {
			const patternList = argument.split(/\r?\n/);

			const someMatch = patternList.some(pattern => minimatch(path, pattern, {dot: true, matchBase: true}));
			return someMatch;
		}

		let check: boolean;
		check = this.ignores(path, argument?.exclude ?? this.exclude);
		if (check) {
			return true;
		}

		check = this.ignores(path, argument?.include ?? this.include);
		if (check) {
			return false;
		}

		check = this.ignores(path, argument?.pattern ?? this.pattern);
		return (argument?.negated ?? this.negated) ? !check : check;
	}
}

/**
 * @public
 */
export class ScannerGitignore extends ScannerMinimatch {
	private static gitignoreToMinimatch<T extends string | string[]>(argument: T): T;
	private static gitignoreToMinimatch(argument: string | string[]): string | string[] {
		if (typeof argument === 'string') {
			return ScannerGitignore.gitignoreToMinimatch(argument.split(/\r?\n/)).join('\n');
		}

		return argument
			.map(p => p.replaceAll(/(#.+$|(?<!\\) )/gm, ''))
			.filter(s => s !== '')
			.map(p => gitignoreToMinimatch(p));
	}

	constructor(options?: PatternScannerOptions) {
		const newOptions = {...options};
		for (const key of ['pattern', 'exclude', 'include'] as const) {
			const value = newOptions[key];
			if (!Object.hasOwn(newOptions, key) || value === undefined) {
				continue;
			}

			const newPattern = ScannerGitignore.gitignoreToMinimatch(value);
			newOptions[key] = newPattern;
		}

		super(options);
	}

	isValid(value: unknown): value is string | string[] {
		if (Array.isArray(value)) {
			return value.every(p => !Array.isArray(p) || this.isValid(value));
		}

		if (typeof value !== 'string') {
			return false;
		}

		try {
			const converted = ScannerGitignore.gitignoreToMinimatch(value);
			minimatch.makeRe(converted);
			return true;
		} catch {
			return false;
		}
	}

	get pattern() {
		return this._pattern;
	}

	set pattern(value: string | string[]) {
		const newPattern = ScannerGitignore.gitignoreToMinimatch(value);
		this._pattern = newPattern;
	}

	get include() {
		return this._include;
	}

	set include(value: string | string[]) {
		const newPattern = ScannerGitignore.gitignoreToMinimatch(value);
		this._include = newPattern;
	}

	get exclude() {
		return this._exclude;
	}

	set exclude(value: string | string[]) {
		const newPattern = ScannerGitignore.gitignoreToMinimatch(value);
		this._exclude = newPattern;
	}
}
