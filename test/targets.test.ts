/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable @typescript-eslint/naming-convention */
import assert from 'node:assert';
import PATH from 'node:path';
import {type FileTree, type FsFixture, createFixture} from 'fs-fixture';
import chalk from 'chalk';
import * as viewig from '../src/index.js';

type Case = {
	should: string | {
		include: string[];
		source: string;
	};
	content: FileTree;
};

type DirectoryCase = Record<string, Case>;
type Plan = Record<string, DirectoryCase>;

const realProject: FileTree = {
	'.github': {},
	'bin/app': '',
	'node_modules/tempdep/indexOf.js': '',
	'lib/cli.js': '',
	'lib/index.js': '',
	'test/app.test.js': '',
	'README.md': '',
	LICENSE: '',
	'config.json': '',
};

const symlinksProject: FileTree = {
	emptyfolder: {},
	awesomefolder: {
		emptyfolder: {},
		folded: '',
	},
	awesomefile: '',
	'awesomefile.lnk': ({symlink}) => symlink('./awesomefile'),
	'awesomefolder.lnk': ({symlink}) => symlink('./awesomefolder'),
};

const targetTestList: Plan = {
	git: {
		'empty project': {
			should: viewig.NoSourceError.name,
			content: {},
		},
		'single file': {
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		},
		'.gitignore': {
			should: {
				include: [
					'file.txt',
					'.gitignore',
				],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': 'node_modules',
			},
		},
		symlinks: {
			should: {
				include: [
					'.gitignore',
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
				],
				source: '.gitignore',
			},
			content: {...symlinksProject, '.gitignore': ''},
		},
	},
	/**
	 * @see {@link npmPatternExclude} {@link npmPatternInclude}
	 */
	npm: {
		'empty project': {
			should: viewig.NoSourceError.name,
			content: {},
		},
		'single file': {
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		},
		'.gitignore': {
			should: {
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': 'node_modules',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		'.gitignore with comment': {
			should: {
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': '#comment\nnode_modules',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		'(package.json), .npmignore, .gitignore': {
			should: {
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'package.json',
				],
				source: 'package.json',
			},
			content: {
				...realProject,
				'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
				'.gitignore': 'node_modules\nconfig.json',
				'package.json': JSON.stringify({
					files: [],
					main: './lib/index.js',
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		'package.json, (.npmignore), .gitignore': {
			should: {
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'lib/cli.js',
					'lib/index.js',
					'package.json',
				],
				source: '.npmignore',
			},
			content: {
				...realProject,
				'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
				'.gitignore': 'node_modules\nconfig.json',
				'package.json': JSON.stringify({
					main: './lib/index.js',
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		symlinks: {
			should: {
				include: [
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
					'package.json',
				],
				source: '.npmignore',
			},
			content: {
				...symlinksProject,
				'.npmignore': '',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
	},
	yarn: {
		'empty project': {
			should: viewig.NoSourceError.name,
			content: {},
		},
		'single file': {
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		},
		'.gitignore': {
			should: {
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': 'node_modules',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		'.gitignore with comment': {
			should: {
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': '#comment\nnode_modules',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		'(package.json), .yarnignore, .npmignore, .gitignore': {
			should: {
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'package.json',
				],
				source: 'package.json',
			},
			content: {
				...realProject,
				'.yarnignore': 'node_modules\nconfig*.json\ntest\n.github\nREADME*',
				'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
				'.gitignore': 'node_modules\nconfig.json',
				'package.json': JSON.stringify({
					files: [],
					main: './lib/index.js',
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		'package.json, (.yarnignore), .npmignore, .gitignore': {
			should: {
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'lib/cli.js',
					'lib/index.js',
					'package.json',
				],
				source: '.yarnignore',
			},
			content: {
				...realProject,
				'.yarnignore': 'node_modules\nconfig*.json\ntest\n.github\nREADME*',
				'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
				'.gitignore': 'node_modules\nconfig.json',
				'package.json': JSON.stringify({
					main: './lib/index.js',
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		'package.json, .yarnignore, (.npmignore), .gitignore': {
			should: {
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'lib/cli.js',
					'lib/index.js',
					'package.json',
				],
				source: '.npmignore',
			},
			content: {
				...realProject,
				'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
				'.gitignore': 'node_modules\nconfig.json',
				'package.json': JSON.stringify({
					main: './lib/index.js',
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
		symlinks: {
			should: {
				include: [
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
					'package.json',
				],
				source: '.yarnignore',
			},
			content: {
				...symlinksProject,
				'.yarnignore': '',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
				}),
			},
		},
	},
	vsce: {
		'empty project': {
			should: viewig.NoSourceError.name,
			content: {},
		},
		'single file': {
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		},
		'.vscodeignore': {
			should: {
				include: [
					'file.txt',
					'.vscodeignore',
					'package.json',
				],
				source: '.vscodeignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.vscodeignore': 'node_modules',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
					engines: {vscode: '>=1.0.0'},
				}),
			},
		},
		symlinks: {
			should: {
				include: [
					'.vscodeignore',
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
					'package.json',
				],
				source: '.vscodeignore',
			},
			content: {
				...symlinksProject,
				'.vscodeignore': '',
				'package.json': JSON.stringify({
					name: 'app',
					version: '0.0.1',
					engines: {vscode: '>=1.0.0'},
				}),
			},
		},
	},
};

describe('Targets', () => {
	before(async () => {
		await viewig.Plugins.loadBuiltIns();
	});
	for (const targetId in targetTestList) {
		if (!Object.hasOwn(targetTestList, targetId)) {
			continue;
		}

		describe(targetId, () => {
			const tests = targetTestList[targetId];
			for (const testName in tests) {
				if (!Object.hasOwn(tests, testName)) {
					continue;
				}

				it(testName, async () => {
					after(async () => {
						await fixture.rm();
					});
					const fixture = await createFixture(tests[testName].content);
					await testTargetSubtest({
						fixture,
						targetId,
						test: tests[testName],
					});
				});
			}
		});
	}
});

type TestTargetSubtestData = {
	fixture: FsFixture;
	targetId: string;
	test: Case;
};

async function testTargetSubtest(data: TestTargetSubtestData) {
	const {fixture, targetId, test} = data;
	const {should} = test;

	const fileInfoListPromise = viewig.scan('.', {target: targetId, cwd: fixture.getPath(), filter: 'included'});
	void fileInfoListPromise.catch(() => { /* empty */ });

	if (typeof should === 'string') {
		try {
			await fileInfoListPromise;
			assert.throws(async () => {
				await fileInfoListPromise;
			});
		} catch (error) {
			assert(error instanceof Error, `Expected ViewIgnoredError, got ${String(error)}`);
			assert(error instanceof viewig.ViewIgnoredError, `Expected ViewIgnoredError, got ${error.name}`);
			assert(error.name === should, `Expected ${should}, got ${error.name}`);
		}

		return;
	}

	assert.doesNotThrow(async () => {
		await fileInfoListPromise;
	});
	const fileInfoList = await fileInfoListPromise;
	const cmp1 = fileInfoList.map(l => l.toString()).sort();
	const cmp2 = should.include.map(filePath => filePath.split(PATH.posix.sep).join(PATH.sep)).sort();
	const actual = fileInfoList
		.map(fileInfo => `${chalk.red(fileInfo.toString({source: true, chalk}))}`)
		.sort().join('\n        ');
	const info = `\n      Results:\n        ${actual}\n`;
	for (const fileInfo of (await fileInfoListPromise)) {
		const sourceString = fileInfo.source.relativePath;
		assert.strictEqual(sourceString, should.source, 'The source is not right.' + chalk.white(info));
	}

	assert.deepEqual(cmp1, cmp2, 'The path list is bad.' + chalk.white(info));
}

