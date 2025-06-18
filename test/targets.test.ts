
/* eslint-disable @typescript-eslint/naming-convention */
import assert, {AssertionError} from 'node:assert';
import {type FileTree, createFixture} from 'fs-fixture';
import chalk from 'chalk';
import * as viewig from '../src/index.js';

type Check = {
	include: string[];
	source: string;
};

type Case = {
	should: string | Check[];
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
			should: [{
				include: [
					'file.txt',
					'.gitignore',
				],
				source: '.gitignore',
			}],
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': 'node_modules',
			},
		});
		testTarget('nested should use parent', {
			targetId,
			should: [{
				include: [
					'app/file.txt',
					'app/.gitignore',
				],
				source: 'app/.gitignore',
			}],
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
			should: [{
				include: [
					'.gitignore',
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
				],
				source: '.gitignore',
			}],
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
			should: [{
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			}],
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
			should: [{
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			}],
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
			should: [{
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'package.json',
				],
				source: 'package.json',
			}],
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
			should: [{
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'lib/cli.js',
					'lib/index.js',
					'package.json',
				],
				source: '.npmignore',
			}],
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
		testTarget('nested should use parent .npmignore', {
			targetId,
			should: [
				{
					include: [
						'LICENSE',
						'README.md',
						'bin/app',
						'lib/cli.js',
						'lib/index.js',
						'package.json',
						'app2/LICENSE',
						'app2/README.md',
						'app2/bin/app',
						'app2/lib/cli.js',
						'app2/lib/index.js',
						'app2/package.json',
					],
					source: '.npmignore',
				},
			],
			content: {
				...realProject,
				'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
				'.gitignore': 'node_modules\nconfig.json',
				'package.json': JSON.stringify({
					main: './lib/index.js',
					name: 'app1',
					version: '0.0.1',
				}),
				app2: {
					...realProject,
					'.npmignore': 'lib',
					'.gitignore': 'node_modules\nconfig.json',
					'package.json': JSON.stringify({
						main: './lib/index.js',
						name: 'app2',
						version: '0.0.1',
					}),
				},
			},
		});
		testTarget('separate should use own x/.npmignore', {
			targetId,
			should: [
				{
					include: [
						'app1/LICENSE',
						'app1/README.md',
						'app1/bin/app',
						'app1/lib/cli.js',
						'app1/lib/index.js',
						'app1/package.json',
					],
					source: 'app1/.npmignore',
				},
				{
					include: [
						'app2/LICENSE',
						'app2/README.md',
						'app2/bin/app',
						'app2/lib/cli.js',
						'app2/lib/index.js',
						'app2/package.json',
					],
					source: 'app2/.npmignore',
				},
			],
			content: {
				app1: {
					...realProject,
					'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
					'.gitignore': 'node_modules\nconfig.json',
					'package.json': JSON.stringify({
						main: './lib/index.js',
						name: 'app1',
						version: '0.0.1',
					}),
				},
				app2: {
					...realProject,
					'.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
					'.gitignore': 'node_modules\nconfig.json',
					'package.json': JSON.stringify({
						main: './lib/index.js',
						name: 'app2',
						version: '0.0.1',
					}),
				},
				'package.json': JSON.stringify({
					name: 'monorepo',
					version: '0.0.1',
				}),
			},
		});
		testTarget('symlinks', {
			targetId,
			should: [{
				include: [
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
					'package.json',
				],
				source: '.npmignore',
			}],
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
			should: [{
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			}],
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
			should: [{
				include: ['file.txt', 'package.json'],
				source: '.gitignore',
			}],
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
			should: [{
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'package.json',
				],
				source: 'package.json',
			}],
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
			should: [{
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'lib/cli.js',
					'lib/index.js',
					'package.json',
				],
				source: '.yarnignore',
			}],
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
			should: [{
				include: [
					'LICENSE',
					'README.md',
					'bin/app',
					'lib/cli.js',
					'lib/index.js',
					'package.json',
				],
				source: '.npmignore',
			}],
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
			should: [{
				include: [
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
					'package.json',
				],
				source: '.yarnignore',
			}],
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
			should: [{
				include: [
					'file.txt',
					'.vscodeignore',
					'package.json',
				],
				source: '.vscodeignore',
			}],
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
			should: [{
				include: [
					'.vscodeignore',
					'awesomefile',
					'awesomefolder/folded',
					'awesomefile.lnk',
					'awesomefolder.lnk',
					'package.json',
				],
				source: '.vscodeignore',
			}],
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

		const fileInfoListPromise = viewig.scan('.', {
			posix: true,
			target: targetId,
			cwd: fixture.getPath(),
			filter: 'included',
		});

		if (typeof should === 'string') {
			try {
				await fileInfoListPromise;
			} catch (error) {
				assert.ok(error instanceof Error, `Expected ViewIgnoredError, got ${String(error)}`);
				assert.ok(error instanceof viewig.ViewIgnoredError, `Expected ViewIgnoredError, got ${error.name}`);
				assert.ok(error.name === should, `Expected ${should}, got ${error.name}`);
				return;
			}

			const fileInfoList = await fileInfoListPromise;
			throw new AssertionError({message: `Expected ViewIgnoredError exception, got valid file info list: ${fileInfoList.join(', ')}.`});
		}

		const fileInfoList = await fileInfoListPromise;
		const shouldPaths = should
			.flatMap(shouldCase => shouldCase.include);

		const info = `\n${
			fileInfoList.length === 0
				? ''
				: `\tResults:\n\t  ${fileInfoList.map(fileInfo => fileInfo.toString({source: true})).join('\n\t  ')}\n\n`
		}`
			.replaceAll('\t', ' '.repeat(6));

		assert.deepEqual(fileInfoList.map(String).sort(), shouldPaths.sort(), 'Bad path list.');

		for (const fileInfo of fileInfoList) {
			const {source} = fileInfo;
			if (fileInfo.status === 'non-target') {
				throw new AssertionError({message: 'Unexpected non-target file.' + chalk.white(info)});
			}

			assert.ok(source !== undefined, 'The source is missing, but expected.' + chalk.white(info));
			const comparableSource = source?.relativePath;
			const shouldCase: Check | undefined = should.find(shouldCase => shouldCase.source === comparableSource);
			if (shouldCase === undefined) {
				const sourceListExpected = should.map(s => s.source);
				throw new AssertionError({message: `The source is not right: ${comparableSource}. Expected: ${sourceListExpected.join(' or ')}. ${chalk.white(info)}`});
			}

			assert.strictEqual(comparableSource, shouldCase.source, 'Unexpected source.' + chalk.white(info));
		}
	});
}

