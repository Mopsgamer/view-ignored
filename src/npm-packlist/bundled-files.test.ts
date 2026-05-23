import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("bundled-files", () => {
	test("includes bundled dependency using bundleDependencies", async () => {
		await runPacklistTest(
			{
    'package.json': JSON.stringify({
      name: 'test-package',
      version: '3.1.4',
      main: 'elf.js',
      dependencies: {
        history: '1.0.0',
      },
      bundleDependencies: [
        'history',
      ],
      files: ['elf.js'],
    }),
    'elf.js': elfJS,
    '.npmrc': 'packaged=false',
    node_modules: {
      history: {
        'package.json': JSON.stringify({
          name: 'history',
          version: '1.0.0',
          main: 'index.js',
        }),
        'index.js': elfJS,
      },
    },
  },
			[
    'elf.js',
    'node_modules/history/index.js',
    'node_modules/history/package.json',
    'package.json',
  ]
		);
	});
	test("includes bundled dependency using bundledDependencies", async () => {
		await runPacklistTest(
			{
    'package.json': JSON.stringify({
      name: 'test-package',
      version: '3.1.4',
      main: 'elf.js',
      dependencies: {
        history: '1.0.0',
      },
      bundledDependencies: [
        'history',
      ],
      files: ['elf.js'],
    }),
    'elf.js': elfJS,
    '.npmrc': 'packaged=false',
    node_modules: {
      history: {
        'package.json': JSON.stringify({
          name: 'history',
          version: '1.0.0',
          main: 'index.js',
        }),
        'index.js': elfJS,
      },
    },
  },
			[
    'elf.js',
    'node_modules/history/index.js',
    'node_modules/history/package.json',
    'package.json',
  ]
		);
	});
});
