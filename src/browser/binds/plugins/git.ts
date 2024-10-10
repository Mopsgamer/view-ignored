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

/**
 * @private
 */
export const matcherExclude: string[] = [
	'**/.git/**',
	'**/.DS_Store/**',
];

/**
 * For the source file parent directory we are getting all the cache recursively for all files.
 * @param map The output.
 * @param scanner The scanner.
 * @param sourceFile This file will be converted to a {@link SourceInfo}.
 * @private
 */
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

/**
 * @param base The name for gitignore-like file.
 * @private
 */
export const methodologyGitignoreLike = (base: string): Methodology => function (tree, o) {
	const sourceList = tree.deep(File).filter(dirent => dirent.base === base);
	const map = new Map<File, SourceInfo>();
	for (const sourceFile of sourceList) {
		const scanner = new ScannerGitignore({exclude: matcherExclude});

		if (sourceFile === undefined) {
			throw new NoSourceError(base);
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
		target: methodologyGitignoreLike('.gitignore'),
	},
};
const git: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default git;
