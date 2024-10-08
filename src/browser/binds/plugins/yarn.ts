import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	File,
	NoSourceError,
	InvalidPatternError,
	BadSourceError,
	type SourceInfo,
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
	const sourceList = Array.from(tree).filter(dirent => dirent instanceof File && dirent.base === '.gitignore') as File[];
	const map = new Map<File, SourceInfo>();
	for (const sourceFile of sourceList) {
		const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});

		if (sourceFile === undefined) {
			throw new NoSourceError('.gitignore');
		}

		const content = o.modules.fs.readFileSync(sourceFile.absolutePath).toString();
		const pattern = content;
		if (!scanner.isValid(pattern)) {
			throw new InvalidPatternError(sourceFile, pattern);
		}

		scanner.pattern = pattern;
		useSourceFile(map, sourceFile, scanner);
	}

	return map;
};

const methodologyNpmignore: Methodology = function (tree, o) {
	const sourceList = Array.from(tree).filter(dirent => dirent instanceof File && dirent.base === '.npmignore') as File[];
	const map = new Map<File, SourceInfo>();
	for (const sourceFile of sourceList) {
		const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});

		if (sourceFile === undefined) {
			return methodologyGitignore(tree, o);
		}

		const content = o.modules.fs.readFileSync(sourceFile.absolutePath).toString();
		const pattern = content;
		if (!scanner.isValid(pattern)) {
			return methodologyGitignore(tree, o);
		}

		scanner.pattern = pattern;
		useSourceFile(map, sourceFile, scanner);
	}

	return map;
};

const methodologyYarnignore: Methodology = function (tree, o) {
	const sourceList = Array.from(tree).filter(dirent => dirent instanceof File && dirent.base === '.yarnignore') as File[];
	const map = new Map<File, SourceInfo>();
	for (const sourceFile of sourceList) {
		const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});

		if (sourceFile === undefined) {
			return methodologyNpmignore(tree, o);
		}

		const content = o.modules.fs.readFileSync(sourceFile.absolutePath).toString();
		const pattern = content;
		if (!scanner.isValid(pattern)) {
			return methodologyNpmignore(tree, o);
		}

		scanner.pattern = pattern;
		useSourceFile(map, sourceFile, scanner);
	}

	return map;
};

const methodologyPackageJsonFiles = (manifest: npm.ValidManifestNpm): Methodology => function (tree, o) {
	const sourceList = Array.from(tree).filter(dirent => dirent instanceof File && dirent.base === 'package.json') as File[];
	const map = new Map<File, SourceInfo>();
	for (const sourceFile of sourceList) {
		const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude, negated: true});

		const {files: pattern} = manifest;
		if (sourceFile === undefined || !scanner.isValid(pattern)) {
			return methodologyYarnignore(tree, o);
		}

		scanner.pattern = pattern;
		useSourceFile(map, sourceFile, scanner);
	}

	return map;
};

const methodology: Methodology = function (tree, o) {
	const packageJson = Array.from(tree).find(dirent => dirent instanceof File && dirent.base === 'package.json') as File | undefined;
	if (packageJson === undefined) {
		throw new NoSourceError('package.json');
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
