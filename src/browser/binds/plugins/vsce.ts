import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	ErrorNoSources,
	File,
	ErrorInvalidPattern,
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

const methodology: Methodology = function (tree, o) {
	const scanner = new ScannerGitignore({exclude: matcherExclude});
	const sourceFile = tree.findRecursive<File>(dirent => dirent instanceof File && dirent.base === '.vscodeignore');

	if (sourceFile === undefined) {
		throw new ErrorNoSources();
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	// TODO: The manifest can be invalid for publishing like no engine.
	const pattern = content;
	if (!scanner.isValid(pattern)) {
		throw new ErrorInvalidPattern();
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const bind: Plugins.TargetBind = {
	id, icon, name, testCommand, scanOptions: {
		target: methodology,
		defaultScanner: new ScannerGitignore({exclude: matcherExclude}),
	},
};
const vsce: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default vsce;
