import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("package-json-files-with-slashes", () => {
	test("package with slash files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: [
      './fiv.js',
      '/lib/one.js',
      '/lib/two.js',
      '/lib/tre.js',
      './lib/for.js',
    ],
  }),
  'fiv.js': 'fiv',
  lib: {
    'one.js': 'one',
    'two.js': 'two',
    'tre.js': 'tre',
    'for.js': 'for',
    'fiv.js': 'fiv',
    '.npmignore': 'two.js',
    '.DS_Store': 'a store of ds',
  },
},
			[
    'fiv.js',
    'lib/for.js',
    'lib/one.js',
    'lib/tre.js',
    'package.json',
  ]
		);
	});
});
