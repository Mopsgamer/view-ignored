export class SomeError extends Error {}

export class ErrorNoSources extends SomeError {
	constructor(targetId?: string) {
		super(`No available sources${typeof targetId === 'string' ? `: ${targetId}` : ''}.`);
	}
}

export class ErrorTargetNotBound extends SomeError {
	constructor(targetId: string) {
		super(`The target has no bound: '${targetId}'.`);
	}
}
