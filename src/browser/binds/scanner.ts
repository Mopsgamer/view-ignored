import {minimatch} from 'minimatch';
import {gitignoreToMinimatch} from '@humanwhocodes/gitignore-to-minimatch';
import {type Scanner} from '../lib.js';

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

export type ScannerGitignoreOptions = {
	exclude?: string | string[];
	include?: string | string[];
	negated?: boolean;
};

export class ScannerGitignore extends ScannerMinimatch implements Scanner {
	private static gitignoreToMinimatch(argument: string | string[]): string | string[] {
		if (Array.isArray(argument)) {
			return argument.map(p => gitignoreToMinimatch(p));
		}

		return gitignoreToMinimatch(argument);
	}

	constructor(
		patterns: string | string[],
		options?: ScannerGitignoreOptions,
	) {
		const patternsMinimatch = ScannerGitignore.gitignoreToMinimatch(patterns);
		super(patternsMinimatch, options);
	}
}
