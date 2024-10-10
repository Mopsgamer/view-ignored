import assert from 'node:assert';
import * as viewig from '../src/index.js';

describe('scanner', () => {
	it('comment is valid', () => {
		assert.ok(new viewig.Plugins.ScannerGitignore().isValid('#comment'));
	});
});
