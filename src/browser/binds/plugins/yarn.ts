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
import * as npm from './npm.js';
import {useSourceFile} from './git.js';

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

const methodologyYarnignore: Methodology = function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});
	const sourceFile = Array.from(tree).find(dirent => dirent instanceof File && dirent.base === '.yarnignore') as File | undefined;

	if (sourceFile === undefined) {
		return methodologyNpmignore(tree, o);
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	const pattern = content;
	if (!scanner.isValid(pattern)) {
		return methodologyNpmignore(tree, o);
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const methodologyPackageJsonFiles = (manifest: npm.ValidManifestNpm): Methodology => function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude, negated: true});
	const sourceFile = Array.from(tree).find(dirent => dirent instanceof File && dirent.base === 'package.json') as File | undefined;

	const {files: pattern} = manifest;
	if (sourceFile === undefined || !scanner.isValid(pattern)) {
		return methodologyYarnignore(tree, o);
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

	if (!npm.isValidManifest(manifest)) {
		throw new BadSourceError(packageJson, 'Must have name and version.');
	}

	return methodologyPackageJsonFiles(manifest)(tree, o);
};

const bind: Plugins.TargetBind = {
	id, icon, name, scanOptions: {
		target: methodology,
	},
};
const yarn: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default yarn;
