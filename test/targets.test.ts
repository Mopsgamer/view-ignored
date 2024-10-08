
/* eslint-disable @typescript-eslint/naming-convention */
import assert from 'node:assert';
import PATH from 'node:path';
import {type FileTree, createFixture} from 'fs-fixture';
import chalk from 'chalk';
import * as viewig from '../src/index.js';

type Case = {
	should: string | {
		include: string[];
		source: string;
	};
	content: FileTree;
};

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

describe('Targets', () => {
	before(async () => {
		await viewig.Plugins.loadBuiltIns();
	});
	let targetId = 'git';
	describe(targetId, () => {
		testTarget('empty folder', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {},
		});
		testTarget('single file', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		});
		testTarget('.gitignore', {
			targetId,
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
		});
		testTarget('nested .gitignore', {
			targetId,
			should: {
				include: [
					'app/file.txt',
					'app/.gitignore',
				],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				app: {
					'file.txt': '',
					'node_modules/tempdep/indexOf.js': '',
					'.gitignore': 'node_modules',
				},
			},
		});
		testTarget('symlinks', {
			targetId,
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
		});
	});
	targetId = 'npm';
	describe(targetId, () => {
		testTarget('empty project', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {},
		});
		testTarget('single file', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		});
		testTarget('.gitignore', {
			targetId,
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
		});
		testTarget('.gitignore with comment', {
			targetId,
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
		});
		testTarget('(package.json), .npmignore, .gitignore', {
			targetId,
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
		});
		testTarget('package.json, (.npmignore), .gitignore', {
			targetId,
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
		});
		testTarget('symlinks', {
			targetId,
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
		});
	});
	targetId = 'yarn';
	describe(targetId, () => {
		testTarget('empty project', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {},
		});
		testTarget('single file', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		});
		testTarget('.gitignore', {
			targetId,
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
		});
		testTarget('.gitignore with comment', {
			targetId,
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
		});
		testTarget('(package.json), .yarnignore, .npmignore, .gitignore', {
			targetId,
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
		});
		testTarget('package.json, (.yarnignore), .npmignore, .gitignore', {
			targetId,
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
		});
		testTarget('package.json, .yarnignore, (.npmignore), .gitignore', {
			targetId,
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
		});
		testTarget('symlinks', {
			targetId,
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
		});
	});
	targetId = 'vsce';
	describe(targetId, () => {
		testTarget('empty project', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {},
		});
		testTarget('single file', {
			targetId,
			should: viewig.NoSourceError.name,
			content: {
				'file.txt': '',
			},
		});
		testTarget('.vscodeignore', {
			targetId,
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
		});
		testTarget('symlinks', {
			targetId,
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
		});
	});
});

type TestTargetSubtestData = Case & {
	targetId: string;
};

function testTarget(title: string, data: TestTargetSubtestData) {
	it(title, async () => {
		after(async () => {
			await fixture.rm();
		});
		const {targetId, should} = data;
		const fixture = await createFixture(data.content);

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
	});
}

