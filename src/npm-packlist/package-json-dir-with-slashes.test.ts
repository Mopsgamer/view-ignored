import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("package-json-dir-with-slashes", () => {
	test("package with slash directories", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: [
      '/lib',
      './lib2',
      './lib3/*',
    ],
  }),
  lib: {
    'one.js': 'one',
    'two.js': 'two',
    'tre.js': 'tre',
    'for.js': 'for',
    '.npmignore': 'two.js',
  },
  lib2: {
    'fiv.js': 'fiv',
    '.DS_Store': 'a store of ds',
  },
  lib3: 'not a dir',
},
			[
    'lib2/fiv.js',
    'lib/for.js',
    'lib/one.js',
    'lib/tre.js',
    'package.json',
  ]
		);
	});
});
