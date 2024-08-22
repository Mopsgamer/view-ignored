import getValue from 'get-value';
import * as minimatch from 'minimatch';
import {
	type Plugins, type Methodology, type IsValid,
	type Read,
	type SourceInfo,
} from '../../index.js';
import {ScannerMinimatch} from '../scanner.js';

export const id = 'yarn';
export const name = 'Yarn';

/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
export const matcherExclude = [
	'node_modules/**',
	'.*.swp',
	'._*',
	'.DS_Store/**',
	'.git/**',
	'.gitignore',
	'.hg/**',
	'.yarnignore',
	'.npmignore',
	'.npmrc',
	'.lock-wscript',
	'.svn/**',
	'.wafpickle-*',
	'config.gypi',
	'CVS/**',
	'npm-debug.log',
];
/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
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

export const isValidSourceMinimatch: IsValid = function (o, sourceInfo) {
	const pat = (sourceInfo.content ?? sourceInfo.readSync(o.fsa, o.cwd)).toString();
	if (!scanner.isValid(pat)) {
		return false;
	}

	scanner.update(pat);
	return true;
};

export const isValidSourceMinimatchPakcageJson: IsValid = function (o, sourceInfo) {
	let parsed: Record<string, unknown>;
	try {
		const pat = (sourceInfo.content ?? sourceInfo.readSync(o.fsa, o.cwd)).toString();
		const json: unknown = JSON.parse(pat);
		if (json?.constructor !== Object) {
			return false;
		}

		parsed = json as Record<string, unknown>;
	} catch {
		return false;
	}

	const propertyValue: unknown = getValue(parsed, 'files');
	if (!Array.isArray(propertyValue) || !scanner.isValid(propertyValue)) {
		return false;
	}

	return true;
};

const read: Read = function (o, sourceInfo: SourceInfo) {
	const content = (sourceInfo.content ?? sourceInfo.readSync(o.fsa, o.cwd)).toString();
	scanner.negated = false;
	scanner.update(content);
	return scanner;
};

const readJson: Read = function (o, sourceInfo: SourceInfo) {
	const content = (sourceInfo.content ?? sourceInfo.readSync(o.fsa, o.cwd)).toString();
	scanner.negated = true;
	scanner.update((JSON.parse(content) as {files: string[]}).files);
	return scanner;
};

export const methodology: Methodology[] = [
	{
		pattern: ['**/package.json'], isValidSource: isValidSourceMinimatchPakcageJson, read: readJson,
	},
	{
		pattern: '**/.yarnignore', isValidSource: isValidSourceMinimatch, read,
	},
	{
		pattern: ['**/.npmignore'], isValidSource: isValidSourceMinimatch, read,
	},
	{
		pattern: ['**/.gitignore'], isValidSource: isValidSourceMinimatch, read,
	},
];

const bind: Plugins.TargetBind = {id, name, methodology};
const yarn: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default yarn;
