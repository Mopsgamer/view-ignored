import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type IsValid, type Methodology,
	type Read,
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

const scanner = new ScannerGitignore('', {exclude: matcherExclude});

const find: IsValid = function (o, s) {
	if (s.base !== '.vscodeignore') {
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
		findSource: find, readSource: read,
	},
];

const bind: Plugins.TargetBind = {
	id, icon, name, methodology, testCommand,
};
const vsce: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default vsce;
