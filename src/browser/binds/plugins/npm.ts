import getValue from 'get-value';
import {type Plugins, type ScanMethod, type Methodology} from '../../index.js';

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

export const scanGit: ScanMethod = function (data) {
	const {scanner, content} = data;
	const pat = content?.toString();
	if (!scanner.patternIsValid(pat)) {
		return false;
	}

	scanner.add(pat);
	return true;
};

export const scanPackageJsonFiles: ScanMethod = function (data) {
	const {scanner, content} = data;
	let parsed: Record<string, unknown>;
	try {
		const pat = content?.toString();
		if (!pat) {
			return false;
		}

		const json: unknown = JSON.parse(pat);
		if (json?.constructor !== Object) {
			return false;
		}

		parsed = json as Record<string, unknown>;
	} catch {
		return false;
	}

	const propertyValue: unknown = getValue(parsed, 'files');
	if (!scanner.patternIsValid(propertyValue)) {
		return false;
	}

	scanner.add(propertyValue);
	return true;
};

export const methodology: Methodology[] = [
	{
		pattern: ['**/package.json'], matcherNegated: true, matcher: 'gitignore', scan: scanPackageJsonFiles, matcherInclude, matcherExclude,
	},
	{
		pattern: ['**/.npmignore'], matcher: 'gitignore', scan: scanGit, matcherInclude, matcherExclude,
	},
	{
		pattern: ['**/.gitignore'], matcher: 'gitignore', scan: scanGit, matcherInclude, matcherExclude,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
const npm: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default npm;
