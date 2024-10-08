import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	File,
	NoSourceError,
	InvalidPatternError,
	BadSourceError,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';
import {useSourceFile} from './git.js';

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
	&& ('version' in value_ && typeof value_.version === 'string');
}

const methodologyGitignore: Methodology = function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});
	const sourceFile = Array.from(tree).find(dirent => dirent instanceof File && dirent.base === '.gitignore') as File | undefined;

	if (sourceFile === undefined) {
		throw new NoSourceError('.gitignore');
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	const pattern = content;
	if (!scanner.isValid(pattern)) {
		throw new InvalidPatternError(sourceFile, pattern);
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const methodologyNpmignore: Methodology = function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});
	const sourceFile = Array.from(tree).find(dirent => dirent instanceof File && dirent.base === '.npmignore') as File | undefined;

	if (sourceFile === undefined) {
		return methodologyGitignore(tree, o);
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	const pattern = content;
	if (!scanner.isValid(pattern)) {
		return methodologyGitignore(tree, o);
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const methodologyPackageJsonFiles = (manifest: ValidManifestNpm): Methodology => function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude, negated: true});
	const sourceFile = Array.from(tree).find(dirent => dirent instanceof File && dirent.base === 'package.json') as File | undefined;

	const {files: pattern} = manifest;
	if (sourceFile === undefined || !scanner.isValid(pattern)) {
		return methodologyNpmignore(tree, o);
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const methodology: Methodology = function (tree, o) {
	const packageJson = Array.from(tree).find(dirent => dirent instanceof File && dirent.base === 'package.json') as File | undefined;
	if (packageJson === undefined) {
		throw new NoSourceError('package.json');
	}

	const packageJsonContent = o.fsa.readFileSync(packageJson.absolutePath).toString();
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
		throw new BadSourceError(packageJson, 'Must have name and version.');
	}

	return methodologyPackageJsonFiles(manifest)(tree, o);
};

const bind: Plugins.TargetBind = {
	id, icon, name, testCommand, scanOptions: {
		target: methodology,
	},
};
const npm: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default npm;
