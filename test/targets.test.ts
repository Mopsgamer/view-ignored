/* eslint-disable @typescript-eslint/naming-convention */
import assert from 'node:assert';
import {readFileSync} from 'node:fs';
import {type FileTree, createFixture} from 'fs-fixture';
import chalk from 'chalk';
import * as viewig from '../src/index.js';

type Case = {
	should: typeof viewig.SomeError | {
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
	'config.json': '',
};

const targetTestList: Plan = {
	git: {
		'empty project': {
			should: viewig.ErrorNoSources,
			content: {},
		},
		'single file': {
			should: viewig.ErrorNoSources,
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
	},

	/**
	 * @see {@link npmPatternExclude} {@link npmPatternInclude}
	 */
	npm: {
		'empty project': {
			should: viewig.ErrorNoSources,
			content: {},
		},
		'single file': {
			should: viewig.ErrorNoSources,
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
		'real project: (package.json), .npmignore, .gitignore': {
			should: {
				include: [
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
		'real project: package.json, (.npmignore), .gitignore': {
			should: {
				include: [
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
	},

	/**
	 * @todo Add tests.
	 */
	yarn: {
		'empty project': {
			should: viewig.ErrorNoSources,
			content: {},
		},
	},

	/**
	 * @todo Add tests.
	 */
	vsce: {
		'empty project': {
			should: viewig.ErrorNoSources,
			content: {},
		},
		'single file': {
			should: viewig.ErrorNoSources,
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
	},
};

function lineInfo(line: number, name?: string) {
	return `${chalk.cyan('./test/targets.test.ts')}${chalk.white(':')}${chalk.yellow(line)}${name ? `\t- ${name}` : ''}`;
}

async function testShit(targetId: string, test: Case, testName: string, myContentLines: string[]) {
	const {should, content} = test;

	const fixture = await createFixture(content);
	const fileInfoListPromise = viewig.scanProject(targetId, {cwd: fixture.getPath(), filter: 'included'});

	if (typeof should !== 'object') {
		try {
			await fileInfoListPromise;
			assert.throws(async () => {
				await fileInfoListPromise;
			});
		} catch (error) {
			assert(error instanceof should, 'Bad SomeError prototype.');
		}

		return;
	}

	const fileInfoList = await fileInfoListPromise;
	void fixture.rm();
	const cmp1 = fileInfoList.map(l => l.toString()).sort();
	const cmp2 = should.include.sort();
	const testLine = myContentLines.findIndex(ln => ln.includes(testName)) + 1;
	const testLineContent = testLine + myContentLines.slice(testLine).findIndex(ln => ln.includes('content')) + 1;
	const actual = fileInfoList
		.map(l => {
			const testLineSource = testLineContent + myContentLines.slice(testLineContent).findIndex(ln => ln.includes(l.source.sourcePath)) + 1;
			return chalk.red(l.toString({source: true, chalk})) + ' ' + lineInfo(testLineSource);
		})
		.sort().join('\n        ');
	const info = `\n      Test location: ${lineInfo(testLine)}\n      Test name: ${chalk.magenta(testName)}\n      Results: \n        ${actual}\n`;
	for (const fileInfo of (await fileInfoListPromise)) {
		assert.strictEqual(fileInfo.source.sourcePath, should.source, 'The source is not right.' + chalk.white(info));
	}

	assert.deepEqual(cmp1, cmp2, 'The path list is bad.' + chalk.white(info));
}

describe('Targets', () => {
	const myContent = readFileSync('./test/targets.test.ts').toString();
	const myContentLines = myContent.split('\n');
	before(async () => {
		await viewig.Plugins.builtIns;
	});
	for (const targetId in targetTestList) {
		if (!Object.hasOwn(targetTestList, targetId)) {
			continue;
		}

		describe(targetId, () => { // eslint-disable-line @typescript-eslint/no-loop-func
			const tests = targetTestList[targetId];
			for (const testName in tests) {
				if (!Object.hasOwn(tests, testName)) {
					continue;
				}

				it(testName, async () => {
					await testShit(targetId, tests[testName], testName, myContentLines);
				});
			}
		});
	}
});
