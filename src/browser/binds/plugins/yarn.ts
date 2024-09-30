import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology, type FindSource,
	type ReadSource,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';
import * as npm from './npm.js';

const id = 'yarn';
const name: TargetName = 'Yarn';
const icon: TargetIcon = {...icons['nf-seti-yarn'], color: 0x2E_2A_65};

/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
const matcherExclude = [
	...npm.matcherExclude,
	'.yarnignore',
	'.yarnrc',
];
/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
const matcherInclude = [
	...npm.matcherInclude,
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

const findYarnignore: FindSource = function (o, s) {
	if (s.base !== '.yarnignore') {
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
		findSource: findYarnignore, readSource: read,
	},
	{
		findSource: findNpmignore, readSource: read,
	},
	{
		findSource: findGitignore, readSource: read,
	},
];

const bind: Plugins.TargetBind = {
	id, icon, name, methodology, scanOptions: {defaultScanner: scanner},
};
const yarn: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default yarn;
