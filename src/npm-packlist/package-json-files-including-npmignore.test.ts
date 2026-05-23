import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("package-json-files-including-npmignore", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: [
      'lib/sub/*.js',
      'lib/.npmignore',
    ],
  }),
  lib: {
    '.npmignore': 'two.js',
    sub: {
      'one.js': 'one',
      'two.js': 'two',
      'tre.js': 'tre',
      'for.js': 'for',
    },
    '.DS_Store': 'a store of ds',
  },
},
			[
    'lib/sub/for.js',
    'lib/sub/one.js',
    'lib/sub/tre.js',
    'package.json',
  ]
		);
	});
});
