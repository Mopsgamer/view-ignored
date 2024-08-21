import ignore from 'ignore';
import {
	type Plugins, type IsValid, type Methodology,
	type Read,
	type SourceInfo,
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

export const isValidSource: IsValid = function (sourceInfo) {
	const pat = (sourceInfo.content ?? sourceInfo.readSync()).toString();
	if (!scanner.isValid(pat)) {
		return false;
	}

	scanner.update(pat);
	return true;
};

const read: Read = function (sourceInfo: SourceInfo) {
	const content = (sourceInfo.content ?? sourceInfo.readSync()).toString();
	scanner.update(content);
	return scanner;
};

export const methodology: Methodology[] = [
	{
		pattern: '**/.vscodeignore', isValidSource, read,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
const vsce: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default vsce;
