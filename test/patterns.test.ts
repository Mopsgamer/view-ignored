import assert from 'node:assert';
import * as viewig from '../src/index.js';

describe('Patterns', () => {
	const testList: Record<viewig.PatternType, Array<[pattern: string, str: string, shouldMatch?: boolean]>> = {
		gitignore: [
			['file', 'file'],
			['dir', 'dir/file'],
			['dir/**', 'dir/file'],
		],
		minimatch: [
			['file', 'file'],
			['dir', 'dir/file'],
			['dir/**', 'dir/file'],
		],
	};

	for (const patternType in testList) {
		describe(patternType, () => {
			for (const [pattern, string_, shouldMatch] of testList[patternType as viewig.PatternType]) {
				it(`'${string_}'${shouldMatch === false ? ' not' : ''} matches the pattern '${pattern}'`, () => {
					assert.strictEqual(new viewig.Scanner({patternType: 'gitignore'}).add(pattern).matches(string_), shouldMatch ?? true, `The pattern '${pattern}' not satisfied by the string '${string_}'`);
				});
			}
		});
	}
});
