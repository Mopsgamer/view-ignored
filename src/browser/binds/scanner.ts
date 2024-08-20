import ignore from 'ignore';
import {minimatch} from 'minimatch';
import {type Scanner} from '../lib.js';

export type ScannerGitignoreOptions = {
	exclude?: string | string[];
	include?: string | string[];
	add?: string | string[];
};

export class ScannerGitignore implements Scanner {
	private static readonly defaultOptions: ignore.Options = {ignoreCase: true};
	private readonly instanceInclude: ignore.Ignore;
	private readonly instanceExclude: ignore.Ignore;
	private instance!: ignore.Ignore;
	constructor(
		gitignoreFileContent: string | string[],
		private readonly options?: ScannerGitignoreOptions,
	) {
		this.instanceInclude = ignore.default(ScannerGitignore.defaultOptions).add(options?.include ?? []);
		this.instanceExclude = ignore.default(ScannerGitignore.defaultOptions).add(options?.exclude ?? []);
		this.update(gitignoreFileContent);
	}

	update(gitignoreFileContent: string | string[]) {
		this.instance = ignore.default(ScannerGitignore.defaultOptions).add(this.options?.add ?? []).add(gitignoreFileContent);
	}

	ignores(path: string): boolean {
		let check: boolean;
		check = this.instanceInclude.ignores(path);
		if (check) {
			return false;
		}

		check = this.instanceExclude.ignores(path);
		if (check) {
			return true;
		}

		check = this.instance.ignores(path);
		return check;
	}
}

export type ScannerMinimatchOptions = {
	exclude?: string | string[];
	include?: string | string[];
};
export class ScannerMinimatch implements Scanner {
	private static ignores(path: string, pattern: string | string[]): boolean {
		if (Array.isArray(pattern)) {
			pattern = pattern.join('\n');
		}

		return minimatch(path, pattern, {dot: true});
	}

	constructor(
		private patterns: string,
		private readonly options?: ScannerMinimatchOptions,
	) {}

	update(patterns: string) {
		this.patterns = patterns;
	}

	ignores(path: string): boolean {
		let check: boolean;
		check = this.options?.include ? ScannerMinimatch.ignores(path, this.options?.include) : false;
		if (check) {
			return false;
		}

		check = this.options?.exclude ? ScannerMinimatch.ignores(path, this.options?.exclude) : false;
		if (check) {
			return true;
		}

		check = this.patterns ? ScannerMinimatch.ignores(path, this.patterns) : false;
		return check;
	}
}
