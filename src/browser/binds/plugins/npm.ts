import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type IsValid, type Methodology,
	type Read,
} from '../../index.js';
import {ScannerMinimatch} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';

const id = 'npm';
const name: TargetName = 'NPM';
const icon: TargetIcon = {...icons['nf-seti-npm'], color: 0xCA_04_04};
const testCommand = 'npm pack --dry-run';

const matcherExclude = [
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
const matcherInclude = [
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

const isValidSourceMinimatch: IsValid = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	if (!scanner.isValid(content)) {
		return false;
	}

	scanner.update(content);
	return true;
};

const findGitignore: IsValid = function (o, s) {
	if (s.base !== '.gitignore') {
		return false;
	}

	return isValidSourceMinimatch(o, s);
};

const findNpmignore: IsValid = function (o, s) {
	if (s.base !== '.npmignore') {
		return false;
	}

	return isValidSourceMinimatch(o, s);
};

const findPackageJson: IsValid = function (o, s) {
	if (s.base !== 'package.json') {
		return false;
	}

	let parsed: Record<string, unknown>;
	try {
		const content = o.fsa.readFileSync(s.absolutePath).toString();
		const json: unknown = JSON.parse(content);
		if (json?.constructor !== Object) {
			return false;
		}

		parsed = json as Record<string, unknown>;
	} catch {
		return false;
	}

	const propertyValue: unknown = parsed.files;
	if (!Array.isArray(propertyValue) || !scanner.isValid(propertyValue)) {
		return false;
	}

	return true;
};

const read: Read = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	scanner.negated = false;
	scanner.update(content);
	return scanner;
};

const readJson: Read = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	scanner.negated = true;
	scanner.update((JSON.parse(content) as {files: string[]}).files);
	return scanner;
};

const methodology: Methodology[] = [
	{
		findSource: findPackageJson, readSource: readJson,
	},
	{
		findSource: findNpmignore, readSource: read,
	},
	{
		findSource: findGitignore, readSource: read,
	},
];

const bind: Plugins.TargetBind = {
	id, icon, name, methodology, testCommand,
};
const npm: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default npm;
