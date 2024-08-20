import {type Methodology} from '../lib.js';
import {targetGet} from './binds/targets.js';

export class SomeError extends Error {}

export class ErrorNoSources extends SomeError {
	public static walk(sources?: (readonly Methodology[]) | string): string {
		const s = typeof sources === 'string' ? targetGet(sources)?.methodology : sources;
		if (!s) {
			return `bad bind for target '${s}'`;
		}

		return s.map(m => `'${String(m.pattern)}'`).join(' -> ');
	}

	constructor(sources?: (readonly Methodology[]) | string) {
		super('No available sources for methodology: ' + ErrorNoSources.walk(sources));
	}
}

export class ErrorTargetNotBound extends SomeError {
	constructor(targetId: unknown) {
		super(`The target has no bound: '${String(targetId)}'.`);
	}
}
