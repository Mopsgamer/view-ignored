import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	NoSourceError,
	File,
	BadSourceError,
} from '../../index.js';
import {type TargetIcon, type TargetName} from '../targets.js';
import * as git from './git.js';

const id = 'vsce';
const name: TargetName = 'VSCE';
const icon: TargetIcon = {...icons['nf-md-microsoft_visual_studio_code'], color: '#23A9F1'};
const testCommand = 'vsce ls';

/**
 * @private
 */
export const matcherExclude: string[] = [
	...git.matcherExclude,
];

/**
 * @private
 */
export type ValidManifestVsce = {
	name: string;
	version: string;
	engines: {vscode: string};
};

/**
 * @private
 */
export function isValidManifest(value: unknown): value is ValidManifestVsce {
	if (value?.constructor !== Object) {
		return false;
	}

	const value_ = value as ValidManifestVsce;
	const isManifestBase = ('name' in value_ && typeof value_.name === 'string')
		&& ('version' in value_ && typeof value_.version === 'string')
		&& ('engines' in value_ && value_.engines?.constructor === Object);

	if (!isManifestBase) {
		return false;
	}

	const {engines} = value as ValidManifestVsce;
	return 'vscode' in engines && typeof engines.vscode === 'string';
}

/**
 * @private
 */
export const methodologyManifestVsce: Methodology = function (tree, o) {
	const packageJson = [...tree.deepIterator()].find(dirent => dirent instanceof File && dirent.base === 'package.json') as File | undefined;
	if (packageJson === undefined) {
		throw new NoSourceError('package.json');
	}

	const packageJsonContent = o.modules.fs.readFileSync(packageJson.absolutePath).toString();
	let manifest: unknown;
	try {
		manifest = JSON.parse(packageJsonContent);
	} catch (error) {
		if (error instanceof Error) {
			throw new BadSourceError(packageJson, error.message);
		}

		throw error;
	}

	if (!isValidManifest(manifest)) {
		throw new BadSourceError(packageJson, 'Must have name, version and engines->vscode.');
	}

	return git.methodologyGitignoreLike('.vscodeignore')(tree, o);
};

const bind: Plugins.TargetBind = {
	id, icon, name, testCommand, scanOptions: {
		target: methodologyManifestVsce,
	},
};
const vsce: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default vsce;
