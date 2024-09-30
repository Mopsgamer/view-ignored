import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type FindSource, type Methodology,
	type ReadSource,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';
import {type TargetIcon, type TargetName} from '../targets.js';

const id = 'vsce';
const name: TargetName = 'VSCE';
const icon: TargetIcon = {...icons['nf-md-microsoft_visual_studio_code'], color: 0x23_A9_F1};
const testCommand = 'vsce ls';

const matcherExclude: string[] = [
	'.git/**',
	'.DS_Store/**',
];

const scanner = new ScannerGitignore({exclude: matcherExclude});

const find: FindSource = function (o, s) {
	if (s.base !== '.vscodeignore') {
		return false;
	}

	const content = o.fsa.readFileSync(s.absolutePath).toString();
	if (!scanner.isValid(content)) {
		return false;
	}

	scanner.pattern = content;
	return true;
};

const read: ReadSource = function (o, s) {
	const content = o.fsa.readFileSync(s.absolutePath).toString();
	scanner.pattern = content;
	return scanner;
};

const methodology: Methodology[] = [
	{
		findSource: find, readSource: read,
	},
];

const bind: Plugins.TargetBind = {
	id, icon, name, methodology, testCommand, scanOptions: {defaultScanner: scanner},
};
const vsce: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default vsce;
