import * as PATH from 'node:path';
import {
	type Plugins, type IsValid, type Methodology,
	type Read,
} from '../../index.js';
import {ScannerGitignore} from '../scanner.js';

export const id = 'vsce';
export const name = 'VSC Extension';
export const testCommand = 'vsce ls';

export const matcherExclude: string[] = [
	'.git/**',
	'.DS_Store/**',
];

const scanner = new ScannerGitignore('', {exclude: matcherExclude});

export const find: IsValid = function (o) {
	if (o.entry.name !== '.vscodeignore') {
		return false;
	}

	const path = o.posix ? PATH : PATH.posix;
	const content = o.fsa.readFileSync(o.entryPath).toString();
	if (!scanner.isValid(content)) {
		return false;
	}

	scanner.update(content);
	return true;
};

const read: Read = function (o) {
	const content = o.fsa.readFileSync(o.sourceInfoPath).toString();
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
