import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	type File,
	Directory,
	InvalidPatternError,
	BadSourceError,
	type SourceInfo,
	NoSourceError,
} from '../../index.js';
import {type PatternScanner, ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';
import * as git from './git.js';

const id = 'npm';
const name: TargetName = 'NPM';
const icon: TargetIcon = {...icons['nf-seti-npm'], color: 0xCA_04_04};
const testCommand = 'npm pack --dry-run';

export const matcherExclude = [
	...git.matcherExclude,
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

export type ValidManifestNpm = {
	name: string;
	version: string;
	files?: string[];
};

export function isValidManifest(value: unknown): value is ValidManifestNpm {
	if (value?.constructor !== Object) {
		return false;
	}

	const value_ = value as Record<string, unknown>;
	return ('name' in value_ && typeof value_.name === 'string')
	&& ('version' in value_ && typeof value_.version === 'string')
	&& (value_.files === undefined || (Array.isArray(value_.files) && value_.files.every(element => typeof element === 'string')));
}

export function useChildren(tree: Directory, map: Map<File, SourceInfo>, getMap: (child: Directory) => Map<File, SourceInfo>) {
	for (const child of Array.from(tree.children.values())) {
		if (!(child instanceof Directory)) {
			continue;
		}

		const submap = getMap(child);
		for (const [key, value] of submap.entries()) {
			map.set(key, value);
		}
	}

	return map;
}

export const sourceSearch = (priority: string[], scanner: PatternScanner): Methodology => function (tree, o) {
	const map = new Map<File, SourceInfo>();

	for (const element of priority) {
		const sourceFile = tree.get(element);

		if (sourceFile === undefined) {
			continue;
		}

		if (sourceFile.base === 'package.json') {
			const manifest = JSON.parse(o.modules.fs.readFileSync(sourceFile.absolutePath).toString()) as unknown;
			if (!isValidManifest(manifest)) {
				throw new BadSourceError(sourceFile, 'Must have \'name\', \'version\' and \'files\'.');
			}

			const {files: pattern} = manifest;

			if (pattern === undefined) {
				continue;
			}

			if (!scanner.isValid(pattern)) {
				throw new BadSourceError(sourceFile, `Invalid pattern, got ${JSON.stringify(pattern)}`);
			}

			scanner.negated = true;
			scanner.pattern = pattern;
		} else {
			const content = o.modules.fs.readFileSync(sourceFile.absolutePath).toString();
			const pattern = content;
			if (!scanner.isValid(pattern)) {
				throw new InvalidPatternError(sourceFile, pattern);
			}

			scanner.negated = false;
			scanner.pattern = pattern;
		}

		return git.useSourceFile(map, sourceFile, scanner);
	}

	return useChildren(tree, map, child => sourceSearch(priority, scanner)(child, o));
};

/**
 * @param priority The list of file names from highest to lowest priority.
 * @param scanner The pattern scanner.
 */
export const methodologyManifestNpmLike = (priority: string[], scanner: PatternScanner): Methodology => function (tree, o) {
	const packageJson = tree.get('package.json');
	if (packageJson === undefined) {
		throw new NoSourceError('\'package.json\' in the root');
	}

	const packageJsonContent = o.modules.fs.readFileSync(packageJson.absolutePath).toString();
	let manifest: unknown;
	try {
		manifest = JSON.parse(packageJsonContent);
	} catch (error) {
		if (error instanceof Error) {
			throw new BadSourceError(packageJson, error.message);
		}

		throw error;
	}

	if (!isValidManifest(manifest)) {
		throw new BadSourceError(packageJson, 'Must have \'name\', \'version\' and \'files\'.');
	}

	return sourceSearch(
		priority,
		scanner,
	)(tree, o);
};

const bind: Plugins.TargetBind = {
	id, icon, name, testCommand, scanOptions: {
		target: methodologyManifestNpmLike(
			['package.json', '.npmignore', '.gitignore'],
			new ScannerGitignore({exclude: matcherExclude, include: matcherInclude}),
		),
	},
};
const npm: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default npm;
