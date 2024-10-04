import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	NoSourcesError,
	File,
	InvalidPatternError,
	SourceFileError,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';
import {useSourceFile} from './git.js';

const id = 'vsce';
const name: TargetName = 'VSCE';
const icon: TargetIcon = {...icons['nf-md-microsoft_visual_studio_code'], color: 0x23_A9_F1};
const testCommand = 'vsce ls';

const matcherExclude: string[] = [
	'.git/**',
	'.DS_Store/**',
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
	const scanner = new ScannerGitignore({exclude: matcherExclude});
	const sourceFile = tree.findAll<File>(dirent => dirent instanceof File && dirent.base === '.vscodeignore');

	if (sourceFile === undefined) {
		throw new NoSourcesError();
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	const pattern = content;
	if (!scanner.isValid(pattern)) {
		throw new InvalidPatternError(sourceFile, pattern);
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const methodology: Methodology = function (tree, o) {
	const packageJson = tree.children.find((dirent): dirent is File =>
		dirent instanceof File && dirent.base === 'package.json',
	);
	if (packageJson === undefined) {
		throw new SourceFileError('package.json', 'Expected a valid json object');
	}

	const packageJsonContent = o.fsa.readFileSync(packageJson.absolutePath).toString();
	let manifest: unknown;
	try {
		manifest = JSON.parse(packageJsonContent);
	} catch (error) {
		if (error instanceof Error) {
			throw new SourceFileError(packageJson, error.message);
		}

		throw error;
	}

	if (!isValidManifest(manifest)) {
		throw new SourceFileError(packageJson, 'Must have name and version.');
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
