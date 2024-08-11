import assert from 'node:assert';
import {SourceInfo} from '../src/lib.js';

describe('SourceInfo.hierarcy farthest', () => {
	it('a, b', () => {
		assert.strictEqual(SourceInfo.hierarcy('file', ['a', 'b'], {closest: false}), 'a');
	});

	it('b, a', () => {
		assert.strictEqual(SourceInfo.hierarcy('file', ['b', 'a'], {closest: false}), 'a');
	});

	it('dir "file"', () => {
		assert.strictEqual(SourceInfo.hierarcy('file', ['file/a', 'a'], {closest: false}), 'a');
	});

	it('dir/a', () => {
		assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/a', 'dir/b', 'a'], {closest: false}), 'a');
	});

	it('dir/dir/a', () => {
		assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/dir/a', 'dir/a', 'a'], {closest: false}), 'a');
	});
});

describe('SourceInfo.hierarcy closest', () => {
	it('a, b', () => {
		assert.strictEqual(SourceInfo.hierarcy('file', ['a', 'b']), 'a');
	});

	it('b, a', () => {
		assert.strictEqual(SourceInfo.hierarcy('file', ['b', 'a']), 'a');
	});

	it('dir "file"', () => {
		assert.strictEqual(SourceInfo.hierarcy('file', ['file/a', 'a']), 'a');
	});

	it('dir/a', () => {
		assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/a', 'dir/b', 'a']), 'dir/a');
	});

	it('dir/dir/a', () => {
		assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/dir/a', 'dir/a', 'a']), 'dir/a');
	});
});
