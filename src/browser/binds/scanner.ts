import ignore from 'ignore';
import {minimatch} from 'minimatch';
import {gitignoreToMinimatch} from '@humanwhocodes/gitignore-to-minimatch';
import {type Scanner} from '../lib.js';

export type ScannerGitignoreOptions = {
	exclude?: string | string[];
	include?: string | string[];
	negated?: boolean;
};

export class ScannerGitignore implements Scanner {
	private static readonly defaultOptions: ignore.Options = {ignoreCase: true};
	public negated: boolean;
	private readonly exclude: string | string[];
	private readonly include: string | string[];
	private readonly instanceInclude: ignore.Ignore;
	private readonly instanceExclude: ignore.Ignore;
	private instance!: ignore.Ignore;
	constructor(
		gitignoreFileContent: string | string[],
		options?: ScannerGitignoreOptions,
	) {
		this.negated = options?.negated ?? false;
		this.exclude = options?.exclude ?? [];
		this.include = options?.include ?? [];
		this.instanceInclude = ignore.default(ScannerGitignore.defaultOptions).add(this.include);
		this.instanceExclude = ignore.default(ScannerGitignore.defaultOptions).add(this.exclude);
		this.update(gitignoreFileContent);
	}

	isValid(pattern: string | string[]): boolean {
		if (Array.isArray(pattern)) {
			return pattern.every(p => this.isValid(p));
		}

		return ignore.default.isPathValid(pattern);
	}

	update(gitignoreFileContent: string | string[]) {
		this.instance = ignore.default(ScannerGitignore.defaultOptions).add(gitignoreFileContent);
	}

	ignores(path: string): boolean {
		let check: boolean;
		check = this.instanceExclude.ignores(path);
		if (check) {
			return true;
		}

		check = this.instanceInclude.ignores(path);
		if (check) {
			return false;
		}

		check = this.instance.ignores(path);
		return this.negated ? !check : check;
	}
}

export type ScannerMinimatchOptions = {
	exclude?: string | string[];
	include?: string | string[];
	negated?: boolean;
};
export class ScannerMinimatch implements Scanner {
	private static ignores(path: string, pattern: string | string[]): boolean {
		if (Array.isArray(pattern)) {
			pattern = pattern.join('\n');
		}

		const patternList = pattern.split(/\r?\n/);

		return patternList.some(pattern => {
			const gipattern = gitignoreToMinimatch(pattern);
			return minimatch(path, gipattern, {dot: true, matchBase: true});
		});
	}

	public negated: boolean;
	private readonly exclude: string | string[];
	private readonly include: string | string[];

	constructor(
		private patterns: string | string[],
		options?: ScannerMinimatchOptions,
	) {
		this.negated = options?.negated ?? false;
		this.exclude = options?.exclude ?? [];
		this.include = options?.include ?? [];
	}

	isValid(pattern: string | string[]): boolean {
		if (Array.isArray(pattern)) {
			return pattern.every(p => this.isValid(p));
		}

		try {
			minimatch.makeRe(pattern);
			return true;
		} catch {
			return false;
		}
	}

	update(patterns: string | string[]) {
		this.patterns = patterns;
	}

	ignores(path: string): boolean {
		let check: boolean;
		check = ScannerMinimatch.ignores(path, this.exclude);
		if (check) {
			return true;
		}

		check = ScannerMinimatch.ignores(path, this.include);
		if (check) {
			return false;
		}

		check = ScannerMinimatch.ignores(path, this.patterns);
		return this.negated ? !check : check;
	}
}
