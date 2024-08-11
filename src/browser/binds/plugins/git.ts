import {
	type Plugins, type ScanMethod, type Methodology, type Styling, type SourceInfo,
} from '../../index.js';

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

const scan: ScanMethod = function (fileInfo: SourceInfo) {
	const {scanner, content} = fileInfo;
	const pat = content?.toString();
	if (!scanner.patternIsValid(pat)) {
		return false;
	}

	scanner.add(pat);
	return true;
};

const methodology: Methodology[] = [
	{
		pattern: '**/.gitignore', matcher: 'gitignore', scan, matcherExclude,
	},
];

const bind: Plugins.TargetBind = {
	id, name, methodology, testCommand,
};
export default ({viewignored: {addTargets: [bind]}} as Plugins.PluginExport);
