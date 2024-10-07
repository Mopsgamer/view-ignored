import {type File} from './lib.js';

export class ViewIgnoredError extends Error {
	name = 'ViewIgnoredError';
}

export class NoSourceError extends ViewIgnoredError {
	name = 'NoSourceError';
	constructor(fileRelativePath: string);
	constructor(file: File);
	constructor(argument0: File | string) {
		super(`There was no configuration file (${typeof argument0 === 'string' ? argument0 : argument0.relativePath}) in the folders and subfolders that would correctly describe the ignoring.`);
	}
}

export class BadSourceError extends ViewIgnoredError {
	name = 'BadSourceError';
	constructor(fileRelativePath: string, message: string);
	constructor(file: File, message: string);
	constructor(argument0: File | string, message: string) {
		super(`Invalid ${typeof argument0 === 'string' ? argument0 : argument0.relativePath}: ${message}`);
	}
}

export class InvalidPatternError extends ViewIgnoredError {
	name = 'InvalidPatternError';
	constructor(file: File, pattern?: string | string[]) {
		super(`Invalid pattern in ${file.relativePath}: ${pattern === undefined ? '' : ` Pattern: ${JSON.stringify(pattern)}`}`);
	}
}

export class TargetNotBoundError extends ViewIgnoredError {
	name = 'TargetNotBoundError';
	constructor(targetId: string) {
		super(`The target has no bound: '${targetId}'.`);
	}
}
