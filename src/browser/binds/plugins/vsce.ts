import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	NoSourceError,
	File,
	InvalidPatternError,
	BadSourceError,
	type SourceInfo,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';
import * as git from './git.js';

const id = 'vsce';
const name: TargetName = 'VSCE';
const icon: TargetIcon = {...icons['nf-md-microsoft_visual_studio_code'], color: 0x23_A9_F1};
const testCommand = 'vsce ls';

export const matcherExclude: string[] = [
	...git.matcherExclude,
];

export type ValidManifestVsce = {
	name: string;
	version: string;
	engines: {vscode: string};
};

export function isValidManifest(value: unknown): value is ValidManifestVsce {
	if (value?.constructor !== Object) {
		return false;
	}

	const value_ = value as ValidManifestVsce;
	const isManifestBase = ('name' in value_ && typeof value_.name === 'string')
	&& ('version' in value_ && typeof value_.version === 'string')
	&& ('engines' in value_ && value_.engines?.constructor === Object);

	if (!isManifestBase) {
		return false;
	}

	const {engines} = value as ValidManifestVsce;
	return 'vscode' in engines && typeof engines.vscode === 'string';
}

const methodologyVscodeignore: Methodology = function (tree, o) {
	const sourceList = tree.deep().filter(dirent => dirent instanceof File && dirent.base === '.vscodeignore') as File[];
	const map = new Map<File, SourceInfo>();
	for (const sourceFile of sourceList) {
		const scanner = new ScannerGitignore({exclude: matcherExclude});

		if (sourceFile === undefined) {
			throw new NoSourceError('.vscodeignore');
		}

		const content = o.modules.fs.readFileSync(sourceFile.absolutePath).toString();
		const pattern = content;
		if (!scanner.isValid(pattern)) {
			throw new InvalidPatternError(sourceFile, pattern);
		}

		scanner.pattern = pattern;
		git.useSourceFile(map, sourceFile, scanner);
	}

	return map;
};

const methodology: Methodology = function (tree, o) {
	const packageJson = Array.from(tree.deepIterator()).find(dirent => dirent instanceof File && dirent.base === 'package.json') as File | undefined;
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

	if (!isValidManifest(manifest)) {
		throw new BadSourceError(packageJson, 'Must have name, version and engines->vscode.');
	}

	return methodologyVscodeignore(tree, o);
};

const bind: Plugins.TargetBind = {
	id, icon, name, testCommand, scanOptions: {
		target: methodology,
	},
};
const vsce: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default vsce;
