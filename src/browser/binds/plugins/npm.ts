import getValue from 'get-value';
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

export const isValidSourceMinimatch: IsValid = function (o) {
	const content = o.fsa.readFileSync(o.entryPath).toString();
	if (!scanner.isValid(content)) {
		return false;
	}

	scanner.update(content);
	return true;
};

export const findGitignore: IsValid = function (o) {
	if (o.entry.name !== '.gitignore') {
		return false;
	}

	return isValidSourceMinimatch(o);
};

export const findNpmignore: IsValid = function (o) {
	if (o.entry.name !== '.npmignore') {
		return false;
	}

	return isValidSourceMinimatch(o);
};

export const findPakcageJson: IsValid = function (o) {
	if (o.entry.name !== 'package.json') {
		return false;
	}

	let parsed: Record<string, unknown>;
	try {
		const content = o.fsa.readFileSync(o.entryPath).toString();
		const json: unknown = JSON.parse(content);
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

const read: Read = function (o) {
	const content = o.fsa.readFileSync(o.sourceInfoPath).toString();
	scanner.negated = false;
	scanner.update(content);
	return scanner;
};

const readJson: Read = function (o) {
	const content = o.fsa.readFileSync(o.sourceInfoPath).toString();
	scanner.negated = true;
	scanner.update((JSON.parse(content) as {files: string[]}).files);
	return scanner;
};

export const methodology: Methodology[] = [
	{
		findSource: findPakcageJson, readSource: readJson,
	},
	{
		findSource: findNpmignore, readSource: read,
	},
	{
		findSource: findGitignore, readSource: read,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
const npm: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default npm;
