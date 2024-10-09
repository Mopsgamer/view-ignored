import {icons} from '@m234/nerd-fonts';
import {
	type Plugins, type Methodology,
	BadSourceError,
	NoSourceError,
} from '../../index.js';
import {type TargetIcon, type TargetName} from '../targets.js';
import {ScannerGitignore} from '../scanner.js';
import * as npm from './npm.js';

const id = 'yarn';
const name: TargetName = 'Yarn';
const icon: TargetIcon = {...icons['nf-seti-yarn'], color: 0x2E_2A_65};

/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
const matcherExclude = [
	...npm.matcherExclude,
	'.yarnignore',
	'.yarnrc',
];
/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
const matcherInclude = [
	...npm.matcherInclude,
];

const methodology: Methodology = function (tree, o) {
	const packageJson = tree.get('package.json');
	if (packageJson === undefined) {
		throw new NoSourceError('\'package.json\' in the root');
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

	if (!npm.isValidManifest(manifest)) {
		throw new BadSourceError(packageJson, 'Must have \'name\', \'version\' and \'files\'.');
	}

	return npm.sourceSearch(
		['package.json', '.yarnignore', '.npmignore', '.gitignore'],
		new ScannerGitignore({exclude: matcherExclude, include: matcherInclude}),
	)(tree, o);
};

const bind: Plugins.TargetBind = {
	id, icon, name, scanOptions: {
		target: methodology,
	},
};
const yarn: Plugins.PluginExport = {viewignored: {addTargets: [bind]}};
export default yarn;
