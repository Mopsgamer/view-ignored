import getValue from 'get-value';
import {type Plugins, type Methodology, type ScanMethod} from '../../index.js';

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
		pattern: '**/package.json', matcherNegated: true, matcher: 'gitignore', scan: scanPackageJsonFiles, matcherInclude, matcherExclude,
	},
	{
		pattern: '**/.yarnignore', matcher: 'gitignore', scan: scanGit, matcherInclude, matcherExclude,
	},
	{
		pattern: '**/.npmignore', matcher: 'gitignore', scan: scanGit, matcherInclude, matcherExclude,
	},
	{
		pattern: '**/.gitignore', matcher: 'gitignore', scan: scanGit, matcherInclude, matcherExclude,
	},
];

const bind: Plugins.TargetBind = {id, name, methodology};
const yarn: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default yarn;
