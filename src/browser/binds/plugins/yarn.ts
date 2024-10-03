import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	File,
	ErrorNoSources,
	ErrorInvalidPattern,
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
	const sourceFile = tree.findAll<File>(dirent => dirent instanceof File && dirent.base === '.gitignore');

	if (sourceFile === undefined) {
		throw new ErrorNoSources();
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	const pattern = content;
	if (!scanner.isValid(pattern)) {
		throw new ErrorInvalidPattern(sourceFile, pattern);
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const methodologyNpmignore: Methodology = function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude});
	const sourceFile = tree.findAll<File>(dirent => dirent instanceof File && dirent.base === '.npmignore');

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
	const sourceFile = tree.findAll<File>(dirent => dirent instanceof File && dirent.base === '.yarnignore');

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

const methodologyManifest: Methodology = function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude, include: matcherInclude, negated: true});
	const sourceFile = tree.findAll<File>(dirent => dirent instanceof File && dirent.base === 'package.json');

	if (sourceFile === undefined) {
		return methodologyYarnignore(tree, o);
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	// TODO: We should throw own error instead of JSON.parse's exception.
	// TODO: What happens if 'files' field is not a string array? What if this strings are comments?
	// TODO: The manifest can be invalid for publishing like no name no version.
	const pattern = (JSON.parse(content) as {files: unknown}).files;
	if (!scanner.isValid(pattern)) {
		return methodologyYarnignore(tree, o);
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const bind: Plugins.TargetBind = {
	id, icon, name, scanOptions: {
		target: methodologyManifest,
		defaultScanner: new ScannerGitignore({exclude: matcherExclude, include: matcherInclude}),
	},
};
const yarn: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default yarn;
