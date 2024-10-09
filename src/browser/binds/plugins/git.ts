import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	File,
	NoSourceError,
	SourceInfo,
	type Scanner,
	InvalidPatternError,
	Directory,
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

export function useSourceFile(map: Map<File, SourceInfo>, sourceFile: File, scanner: Scanner & {pattern: string | string[]}): Map<File, SourceInfo> {
	const sourceInfo = SourceInfo.from(sourceFile, scanner);
	for (const file of sourceFile.parent.deepIterator()) {
		if (file instanceof Directory) {
			continue;
		}

		map.set(file, sourceInfo);
	}

	return map;
}

const methodology: Methodology = function (tree, o) {
	const sourceList = tree.deep().filter(dirent => dirent instanceof File && dirent.base === '.gitignore') as File[];
	const map = new Map<File, SourceInfo>();
	for (const sourceFile of sourceList) {
		const scanner = new ScannerGitignore({exclude: matcherExclude});

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

const bind: Plugins.TargetBind = {
	id, icon, name, testCommand, scanOptions: {
		target: methodology,
	},
};
const git: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default git;
