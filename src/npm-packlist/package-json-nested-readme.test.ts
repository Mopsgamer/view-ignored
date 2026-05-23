import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("package-json-nested-readme", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({}),
  lib: {
    a: {
      b: {
        c: {
          'readme.md': 'one',
          'file.txt': 'one',
          'c.js': 'one',
        },
        'readme.md': 'one',
        'file.txt': 'one',
        'b.js': 'one',
      },
      'readme.md': 'one',
      'file.txt': 'one',
      'a.js': 'one',
    },
  },
  test: {
    a: {
      b: {
        c: {
          'readme.md': 'one',
          'file.txt': 'one',
          'c.js': 'one',
        },
        'readme.md': 'one',
        'file.txt': 'one',
        'b.js': 'one',
      },
      'readme.md': 'one',
      'file.txt': 'one',
      'a.js': 'one',
    },
  },
  '.npmignore': `
  !*.js
  !**/*.js
  test
  `,
},
			[
    'lib/a/a.js',
    'lib/a/b/b.js',
    'lib/a/b/c/c.js',
    'package.json',
    'lib/a/b/c/readme.md',
    'lib/a/b/readme.md',
    'lib/a/readme.md',
    'lib/a/b/c/file.txt',
    'lib/a/b/file.txt',
    'lib/a/file.txt',
  ]
		);
	});
});
