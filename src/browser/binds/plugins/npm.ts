import getValue from 'get-value';
import * as minimatch from 'minimatch';
import {
	type Plugins, type IsValid, type Methodology,
	type Read,
	type SourceInfo,
} from '../../index.js';
import {ScannerMinimatch} from '../scanner.js';

export const id = 'npm';
export const name = 'NPM';
export const testCommand = 'npm pack --dry-run';

export const matcherExclude = [
	'node_modules/**',
	'.*.swp',
	'._*',
	'.DS_Store/**',
	'.git/**',
	'.gitignore',
	'.hg/**',
	'.npmignore',
	'.npmrc',
	'.lock-wscript',
	'.svn/**',
	'.wafpickle-*',
	'config.gypi',
	'CVS/**',
	'npm-debug.log',
];
export const matcherInclude = [
	'/bin/',
	'/package.json',
	'/README',
	'/README.*',
	'/LICENSE',
	'/LICENSE.*',
	'/LICENCE',
	'/LICENCE.*',
];

const scanner = new ScannerMinimatch('', {exclude: matcherExclude, include: matcherInclude});

function isValidPatternMinimatch(pattern: unknown): pattern is string {
	try {
		if (typeof pattern !== 'string') {
			return false;
		}

		minimatch.makeRe(pattern);
		return true;
	} catch {
		return false;
	}
}

export const isValidSourceMinimatch: IsValid = function (sourceInfo) {
	const pat = (sourceInfo.content ?? sourceInfo.readSync()).toString();
	if (!isValidPatternMinimatch(pat)) {
		return false;
	}

	scanner.update(pat);
	return true;
};

export const isValidSourceMinimatchPakcageJson: IsValid = function (sourceInfo) {
	let parsed: Record<string, unknown>;
	try {
		const pat = (sourceInfo.content ?? sourceInfo.readSync()).toString();
		const json: unknown = JSON.parse(pat);
		if (json?.constructor !== Object) {
			return false;
		}

		parsed = json as Record<string, unknown>;
	} catch {
		return false;
	}

	const propertyValue: unknown = getValue(parsed, 'files');
	if (!isValidPatternMinimatch(propertyValue)) {
		return false;
	}

	return true;
};

const read: Read = function (sourceInfo: SourceInfo) {
	scanner.update((sourceInfo.content ?? sourceInfo.readSync()).toString());
	return scanner;
};

export const methodology: Methodology[] = [
	{
		pattern: ['**/package.json'], isValidSource: isValidSourceMinimatchPakcageJson, read,
	},
	{
		pattern: ['**/.npmignore'], isValidSource: isValidSourceMinimatch, read,
	},
	{
		pattern: ['**/.gitignore'], isValidSource: isValidSourceMinimatch, read,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
const npm: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default npm;
