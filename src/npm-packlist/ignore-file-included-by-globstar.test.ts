import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("ignore-file-included-by-globstar", () => {
	test("exclude certain files always", async () => {
		await runPacklistTest(
			{
    '.npmrc': 'secrets=true',
    '.git': {
      HEAD: 'empty',
    },
    node_modules: {
      foo: {
        'index.js': '',
      },
    },
    subdir: {
      'other.js': '',
      '.npmrc': 'sneaky=true',
    },
    'index.js': '',
    'glorp.txt': '',
    'package.json': JSON.stringify({
      name: '@npmcli/globstar-test',
      version: '1.0.0',
      files: ['*'],
    }),
    'package-lock.json': '{}',
    'yarn.lock': '{}',
    'pnpm-lock.yaml': '{}',
  },
			[
    'index.js',
    'subdir/other.js',
    'package.json',
    'glorp.txt',
  ]
		);
	});
	test("include a globstar, then exclude one of them", async () => {
		await runPacklistTest(
			{
    'bar.js': '',
    bar: {
      'bar.js': '',
    },
    'glorp.txt': '',
    'package.json': JSON.stringify({
      name: 'cli-issue-2009',
      version: '1.0.0',
      files: [
        '**/*.js',
        '!foo.js',
      ],
    }),
  },
			[
    'bar.js',
    'bar/bar.js',
    'package.json',
  ]
		);
	});
});
