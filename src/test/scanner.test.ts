import assert from 'node:assert';
import * as viewig from '../index.js';
import {describe, it} from "node:test";

describe('scanner', () => {
	it('comment is valid', () => {
		assert.ok(new viewig.Plugins.ScannerGitignore().isValid('#comment'));
	});
});
