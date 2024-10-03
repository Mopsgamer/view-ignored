import {type File} from './lib.js';

export class SomeError extends Error {}

export class ErrorNoSources extends SomeError {
	constructor() {
		super('There was no configuration file in the folders and subfolders that would correctly describe the ignoring.');
	}
}

export class ErrorInvalidPattern extends SomeError {
	constructor(file: File, pattern?: string | string[]) {
		super(`Got invalid pattern in '${file.relativePath}'.` + (pattern === undefined ? '' : ` Pattern: ${JSON.stringify(pattern)}`));
	}
}

export class ErrorTargetNotBound extends SomeError {
	constructor(targetId: string) {
		super(`The target has no bound: '${targetId}'.`);
	}
}
