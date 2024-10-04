import {type File} from './lib.js';

export class ViewIgnoredError extends Error {}

export class NoSourcesError extends ViewIgnoredError {
	constructor() {
		super('There was no configuration file in the folders and subfolders that would correctly describe the ignoring.');
	}
}

export class SourceFileError extends ViewIgnoredError {
	constructor(fileRelativePath: string, message: string);
	constructor(file: File, message: string);
	constructor(argument0: File | string, message: string) {
		super(`Invalid ${typeof argument0 === 'string' ? argument0 : argument0.relativePath}: ${message}`);
	}
}

export class InvalidPatternError extends ViewIgnoredError {
	constructor(file: File, pattern?: string | string[]) {
		super(`Invalid pattern in ${file.relativePath}: ${pattern === undefined ? '' : ` Pattern: ${JSON.stringify(pattern)}`}`);
	}
}

export class TargetNotBoundError extends ViewIgnoredError {
	constructor(targetId: string) {
		super(`The target has no bound: '${targetId}'.`);
	}
}
