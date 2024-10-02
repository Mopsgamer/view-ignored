import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	File,
	ErrorNoSources,
	SourceInfo,
	type Scanner,
	ErrorInvalidPattern,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';

const id = 'git';
const name: TargetName = 'Git';
const icon: TargetIcon = {...icons['nf-seti-git'], color: 0xF4_4E_28};
const testCommand = 'git ls-tree -r <git-branch-name> --name-only';

const matcherExclude: string[] = [
	'.git/**',
	'.DS_Store/**',
];

const scanner = new ScannerGitignore({exclude: matcherExclude});

export function useSourceFile(sourceFile: File, scanner: Scanner & {pattern: string | string[]}): Map<File, SourceInfo> {
	const map = new Map<File, SourceInfo>();
	const fileList = sourceFile.parent.flat();
	const sourceInfo = SourceInfo.from(sourceFile, scanner);
	for (const file of fileList) {
		map.set(file, sourceInfo);
	}

	return map;
}

const methodology: Methodology = function (tree, o) {
	const sourceFile = tree.findRecursive<File>(dirent => dirent instanceof File && dirent.base === '.gitignore');

	if (sourceFile === undefined) {
		throw new ErrorNoSources();
	}

	const content = o.fsa.readFileSync(sourceFile.absolutePath).toString();
	const pattern = content;
	if (!scanner.isValid(pattern)) {
		throw new ErrorInvalidPattern();
	}

	scanner.pattern = pattern;
	return useSourceFile(sourceFile, scanner);
};

const bind: Plugins.TargetBind = {
	id, icon, name, methodology, testCommand, scanOptions: {defaultScanner: scanner},
};
const git: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default git;
