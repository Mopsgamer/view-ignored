import * as PATH from 'node:path';
import {
	type Plugins, type IsValid, type Methodology,
	type Read,
	type Styling,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';

export const id = 'vsce';
export const name: Styling.DecorConditionOptions = {
	ifNormal: 'VSCE',
	ifNerd: '\uDB82\uDE1E VSCE',
};
export const testCommand = 'vsce ls';

export const matcherExclude: string[] = [
	'.git/**',
	'.DS_Store/**',
];

const scanner = new ScannerGitignore('', {exclude: matcherExclude});

export const find: IsValid = function (o, s) {
	if (s.entry.name !== '.vscodeignore') {
		return false;
	}

	const path = o.posix ? PATH : PATH.posix;
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

export const methodology: Methodology[] = [
	{
		findSource: find, readSource: read,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
const vsce: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default vsce;
