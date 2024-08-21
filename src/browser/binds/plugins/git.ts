import ignore from 'ignore';
import {
	type Plugins, type IsValid, type Methodology, type Styling, type SourceInfo,
	type Read,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';

const id = 'git';
const name: Styling.DecorConditionOptions = {
	ifNormal: 'Git',
	ifNerd: '\uE65D Git',
};
const testCommand = 'git ls-tree -r <git-branch-name> --name-only';

const matcherExclude: string[] = [
	'.git/**',
	'.DS_Store/**',
];

const scanner = new ScannerGitignore('', {exclude: matcherExclude});

const isValidSource: IsValid = function (sourceInfo: SourceInfo) {
	const pat = (sourceInfo.content ?? sourceInfo.readSync()).toString();

	if (!scanner.isValid(pat)) {
		return false;
	}

	scanner.update((sourceInfo.content ?? sourceInfo.readSync()).toString());
	return true;
};

const read: Read = function (sourceInfo: SourceInfo) {
	const content = (sourceInfo.content ?? sourceInfo.readSync()).toString();
	scanner.update(content);
	return scanner;
};

const methodology: Methodology[] = [
	{
		pattern: '**/.gitignore', read, isValidSource,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
const git: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default git;
