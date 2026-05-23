import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("package-json-files-no-dir-nested-npmignore", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: [
      'lib/*.js',
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
