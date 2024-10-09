import assert from 'node:assert';
import * as viewig from '../src/index.js';

describe('directory', () => {
	it('iterator', () => {
		const directory = viewig.Directory.from([
			'foo',
			'bar/foo',
		]);
		assert.deepEqual(directory.deep().length, 3);
	});
});
