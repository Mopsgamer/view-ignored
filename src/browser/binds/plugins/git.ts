import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type FindSource, type Methodology,
	type ReadSource,
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

const scanner = new ScannerGitignore('', {exclude: matcherExclude});

const find: FindSource = function (o, s) {
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

const read: ReadSource = function (o, s) {
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
	id, icon, name, methodology, testCommand,
};
const git: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default git;
