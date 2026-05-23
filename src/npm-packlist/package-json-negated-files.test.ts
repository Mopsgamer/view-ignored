import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("package-json-negated-files", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: [
      'lib',
      '!lib/one',
    ],
  }),
  lib: {
    one: 'one',
    two: 'two',
    tre: 'tre',
    for: 'for',
    '.npmignore': 'two',
    '.DS_Store': 'a store of ds',
  },
},
			[
    'lib/for',
    'lib/tre',
    'package.json',
  ]
		);
	});
});
