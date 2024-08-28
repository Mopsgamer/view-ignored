import getValue from 'get-value';
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

export const isValidSourceMinimatch: IsValid = function (o) {
	const content = o.fsa.readFileSync(o.entryPath).toString();
	if (!scanner.isValid(content)) {
		return false;
	}

	scanner.update(content);
	return true;
};

export const isValidSourceMinimatchGitignore: IsValid = function (o) {
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

export const findYarnignore: IsValid = function (o) {
	if (o.entry.name !== '.yarnignore') {
		return false;
	}

	return isValidSourceMinimatch(o);
};

export const findPackageJson: IsValid = function (o) {
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
	const content = o.fsa.readFileSync(o.sourceInfo.path).toString();
	scanner.negated = false;
	scanner.update(content);
	return scanner;
};

const readJson: Read = function (o) {
	const content = o.fsa.readFileSync(o.sourceInfo.path).toString();
	scanner.negated = true;
	scanner.update((JSON.parse(content) as {files: string[]}).files);
	return scanner;
};

export const methodology: Methodology[] = [
	{
		findSource: findPackageJson, readSource: readJson,
	},
	{
		findSource: findYarnignore, readSource: read,
	},
	{
		findSource: findNpmignore, readSource: read,
	},
	{
		findSource: findPackageJson, readSource: read,
	},
];

const bind: Plugins.TargetBind = {id, name, methodology};
const yarn: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default yarn;
