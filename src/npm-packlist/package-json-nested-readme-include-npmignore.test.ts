import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("package-json-nested-readme-include-npmignore", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: ['.npmignore', 'lib'],
  }),
  lib: {
    '.npmignore': `
    *
    !*.js
    !**/*.js
    test
    `,
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
},
			[
    'lib/a/a.js',
    'lib/a/b/b.js',
    'lib/a/b/c/c.js',
    'package.json',
  ]
		);
	});
});
