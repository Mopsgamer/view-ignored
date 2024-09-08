import {
	type Plugins, type IsValid, type Methodology, type Styling,
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

const find: IsValid = function (o, s) {
	if (s.base !== '.gitignore') {
		return false;
	}

	const content = o.fsa.readFileSync(s.absolutePath).toString();

	if (!scanner.isValid(content)) {
		return false;
	}

	scanner.update(content);
	return true;
};

const read: Read = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	scanner.update(content);
	return scanner;
};

const methodology: Methodology[] = [
	{
		readSource: read, findSource: find,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
const git: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default git;
