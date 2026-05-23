import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("package-json-files-nested-dir-and-nested-ignore", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: [
      'lib/dir',
    ],
  }),
  lib: {
    dir: {
      'one.js': 'one',
      'two.js': 'two',
      'tre.js': 'tre',
      'for.js': 'for',
    },
    '.npmignore': 'dir/two.js',
    '.DS_Store': 'a store of ds',
  },
},
			[
    'lib/dir/for.js',
    'lib/dir/one.js',
    'lib/dir/tre.js',
    'package.json',
  ]
		);
	});
});
