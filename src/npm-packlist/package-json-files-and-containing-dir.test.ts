import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("package-json-files-and-containing-dir", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: [
      'lib',
      '/lib/*.js',
      'lib/*.js',
      '/lib/one.js',
      'lib/one.js',
      'lib/one.*',
    ],
  }),
  lib: {
    'one.js': 'one',
    'two.js': 'two',
    'tre.js': 'tre',
    'for.js': 'for',
    '.npmignore': 'two.js',
    '.DS_Store': 'a store of ds',
  },
},
			[
    'lib/for.js',
    'lib/one.js',
    'lib/tre.js',
    'package.json',
  ]
		);
	});
});
