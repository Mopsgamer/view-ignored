export class SomeError extends Error {}

export class ErrorNoSources extends SomeError {
	constructor() {
		super(`There was no configuration file in the folders and subfolders that would correctly describe the ignoring.`);
	}
}

export class ErrorTargetNotBound extends SomeError {
	constructor(targetId: string) {
		super(`The target has no bound: '${targetId}'.`);
	}
}
