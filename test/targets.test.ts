/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable @typescript-eslint/naming-convention */
import assert from 'node:assert';
import {readFileSync} from 'node:fs';
import PATH from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {type FileTree, type FsFixture, createFixture} from 'fs-fixture';
import chalk from 'chalk';
import * as viewig from '../src/index.js';

type Case = {
	should: typeof viewig.ViewIgnoredError | {
		include: string[];
		source: string;
	};
	content: FileTree;
};

type DirectoryCase = Record<string, Case>;
type Plan = Record<string, DirectoryCase>;

const realProject = {
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

const symlinksTest: Case = {
	should: {
		include: [
			'awesomefile',
			'awesomefolder/folded',
			'awesomefile.lnk',
			'awesomefolder.lnk',
		],
		source: '(default)',
	},
	content: {
		emptyfolder: {},
		awesomefolder: {
			emptyfolder: {},
			folded: '',
		},
		awesomefile: '',
		'awesomefile.lnk': ({symlink}) => symlink('./awesomefile'),
		'awesomefolder.lnk': ({symlink}) => symlink('./awesomefolder'),
	},
};

const targetTestList: Plan = {
	git: {
		'empty project': {
			should: {
				include: [],
				source: '(default)',
			},
			content: {},
		},
		'single file': {
			should: {
				include: ['file.txt'],
				source: '(default)',
			},
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
		symlinks: symlinksTest,
	},
	/**
	 * @see {@link npmPatternExclude} {@link npmPatternInclude}
	 */
	npm: {
		'empty project': {
			should: {
				include: [],
				source: '(default)',
			},
			content: {},
		},
		'single file': {
			should: {
				include: ['file.txt'],
				source: '(default)',
			},
			content: {
				'file.txt': '',
			},
		},
		'.gitignore': {
			should: {
				include: ['file.txt'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': 'node_modules',
			},
		},
		'.gitignore with comment': {
			should: {
				include: ['file.txt'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': '#comment\nnode_modules',
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
		symlinks: symlinksTest,
	},
	yarn: {
		'empty project': {
			should: {
				include: [],
				source: '(default)',
			},
			content: {},
		},
		'single file': {
			should: {
				include: ['file.txt'],
				source: '(default)',
			},
			content: {
				'file.txt': '',
			},
		},
		'.gitignore': {
			should: {
				include: ['file.txt'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': 'node_modules',
			},
		},
		'.gitignore with comment': {
			should: {
				include: ['file.txt'],
				source: '.gitignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.gitignore': '#comment\nnode_modules',
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
		symlinks: symlinksTest,
	},
	vsce: {
		'empty project': {
			should: {
				include: [],
				source: '(default)',
			},
			content: {},
		},
		'single file': {
			should: {
				include: ['file.txt'],
				source: '(default)',
			},
			content: {
				'file.txt': '',
			},
		},
		'.vscodeignore': {
			should: {
				include: [
					'file.txt',
					'.vscodeignore',
				],
				source: '.vscodeignore',
			},
			content: {
				'file.txt': '',
				'node_modules/tempdep/indexOf.js': '',
				'.vscodeignore': 'node_modules',
			},
		},
		symlinks: symlinksTest,
	},
};

const testFilePathJs = PATH.relative(process.cwd(), fileURLToPath(import.meta.url));
const testFilePath = testFilePathJs.replace(new RegExp(`${'out'}[/\\\\]`), '').replace(/js$/, 'ts');
const myContent = readFileSync(testFilePath).toString();
const myContentLines = myContent.split('\n');
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
						testName,
						myContentLines,
					});
				});
			}
		});
	}
});

function lineColumnInfo(filePath: string, line: number, column: number, name?: string) {
	return `${chalk.cyan(filePath)}${chalk.white(':')}${chalk.yellow(line)}${chalk.white(':')}${chalk.yellow(column)}${name ? `\t- ${name}` : ''}`;
}

type TestTargetSubtestData = {
	fixture: FsFixture;
	targetId: string;
	test: Case;
	testName: string;
	myContentLines: string[];
};

async function testTargetSubtest(data: TestTargetSubtestData) {
	const {fixture, myContentLines, targetId, test, testName} = data;
	const {should} = test;

	const fileInfoListPromise = viewig.scan('.', {target: targetId, cwd: fixture.getPath(), filter: 'included'});
	const testLine = myContentLines.findIndex(ln => ln.includes(testName)) + 1;
	const testLineContent = testLine + myContentLines.slice(testLine).findIndex(ln => ln.includes('content')) + 1;
	let info = `\n      Test location: ${lineColumnInfo(testFilePath, testLine, myContentLines[testLine].length)}\n      Test name: ${chalk.magenta(testName)}\n`;

	if (typeof should !== 'object') {
		try {
			await fileInfoListPromise;
			assert.throws(async () => {
				await fileInfoListPromise;
			}, chalk.white(info));
		} catch (error) {
			assert(error instanceof should, 'Bad ViewIgnoredError prototype. ' + info);
		}

		return;
	}

	assert.doesNotThrow(async () => {
		await fileInfoListPromise;
	}, chalk.white(info));
	const fileInfoList = await fileInfoListPromise;
	const cmp1 = fileInfoList.map(l => l.toString()).sort();
	const cmp2 = should.include.map(filePath => filePath.split(PATH.posix.sep).join(PATH.sep)).sort();
	const actual = fileInfoList
		.map(fileInfo => {
			const testLineSource = testLineContent + myContentLines.slice(testLineContent)
				.findIndex(line => line.includes(fileInfo.source.relativePath)) + 1;
			return `${chalk.red(fileInfo.toString({source: true, chalk}))} (${lineColumnInfo(testFilePath, testLineSource, myContentLines[testLineSource].length)})`;
		})
		.sort().join('\n        ');
	info += `      Results: \n        ${actual}\n`;
	for (const fileInfo of (await fileInfoListPromise)) {
		const sourceString = fileInfo.source.relativePath;
		assert.strictEqual(sourceString, should.source, 'The source is not right.' + chalk.white(info));
	}

	assert.deepEqual(cmp1, cmp2, 'The path list is bad.' + chalk.white(info));
}

