import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type FindSource, type Methodology,
	type ReadSource,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';

const id = 'npm';
const name: TargetName = 'NPM';
const icon: TargetIcon = {...icons['nf-seti-npm'], color: 0xCA_04_04};
const testCommand = 'npm pack --dry-run';

export const matcherExclude = [
	'**/node_modules/**',
	'**/.*.swp',
	'**/._*',
	'**/.DS_Store/**',
	'**/.git/**',
	'**/.gitignore',
	'**/.hg/**',
	'**/.npmignore',
	'**/.npmrc',
	'**/.lock-wscript',
	'**/.svn/**',
	'**/.wafpickle-*',
	'**/config.gypi',
	'**/CVS/**',
	'**/npm-debug.log',
];
export const matcherInclude = [
	'bin/**',
	'package.json',
	'README*',
	'LICENSE*',
	'LICENCE*',
];

const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});

const isValidSourceMinimatch: FindSource = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	if (!scanner.isValid(content)) {
		return false;
	}

	scanner.pattern = content;
	return true;
};

const findGitignore: FindSource = function (o, s) {
	if (s.base !== '.gitignore') {
		return false;
	}

	return isValidSourceMinimatch(o, s);
};

const findNpmignore: FindSource = function (o, s) {
	if (s.base !== '.npmignore') {
		return false;
	}

	return isValidSourceMinimatch(o, s);
};

const findPackageJson: FindSource = function (o, s) {
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

const read: ReadSource = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	scanner.negated = false;
	scanner.pattern = content;
	return scanner;
};

const readJson: ReadSource = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	scanner.negated = true;
	scanner.pattern = (JSON.parse(content) as {files: string[]}).files;
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
	id, icon, name, methodology, testCommand, scanOptions: {defaultScanner: scanner},
};
const npm: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default npm;
