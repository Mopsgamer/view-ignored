import assert from 'node:assert';
import {join} from 'node:path';
import {SourceInfo} from '../src/lib.js';

describe('SourceInfo.hierarchy farthest', () => {
	it('a, b', () => {
		assert.strictEqual(SourceInfo.hierarchy('.', ['a', 'b'], {closest: false}), 'a');
	});

	it('b, a', () => {
		assert.strictEqual(SourceInfo.hierarchy('.', ['b', 'a'], {closest: false}), 'a');
	});

	it('dir', () => {
		assert.strictEqual(SourceInfo.hierarchy('dir', [join('dir', 'a'), 'a'], {closest: false}), 'a');
	});

	it(join('dir', 'a'), () => {
		assert.strictEqual(SourceInfo.hierarchy('dir', [join('dir', 'a'), join('dir', 'b'), 'a'], {closest: false}), 'a');
	});

	it(join('dir', 'dir', 'a'), () => {
		assert.strictEqual(SourceInfo.hierarchy('dir', [join('dir', 'dir', 'a'), join('dir', 'a'), 'a'], {closest: false}), 'a');
	});
});

describe('SourceInfo.hierarchy closest', () => {
	it('a, b', () => {
		assert.strictEqual(SourceInfo.hierarchy('.', ['a', 'b']), 'a');
	});

	it('b, a', () => {
		assert.strictEqual(SourceInfo.hierarchy('.', ['b', 'a']), 'a');
	});

	it('dir', () => {
		assert.strictEqual(SourceInfo.hierarchy('dir', [join('dir', 'a'), 'a']), join('dir', 'a'));
	});

	it(join('dir', 'a'), () => {
		assert.strictEqual(SourceInfo.hierarchy('dir', [join('dir', 'a'), join('dir', 'b'), 'a']), join('dir', 'a'));
	});

	it(join('dir', 'dir', 'a'), () => {
		assert.strictEqual(SourceInfo.hierarchy('dir', [join('dir', 'dir', 'a'), join('dir', 'a'), 'a']), join('dir', 'a'));
	});
});
