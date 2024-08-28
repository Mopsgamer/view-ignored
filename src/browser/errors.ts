import {type Methodology} from '../lib.js';

export class SomeError extends Error {}

export class ErrorNoSources extends SomeError {
	constructor(sources?: (readonly Methodology[]) | string) {
		super('No available sources.');
	}
}

export class ErrorTargetNotBound extends SomeError {
	constructor(targetId: unknown) {
		super(`The target has no bound: '${String(targetId)}'.`);
	}
}
