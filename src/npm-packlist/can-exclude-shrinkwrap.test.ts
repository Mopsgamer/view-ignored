import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("can-exclude-shrinkwrap", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: ['.npmignore', '!npm-shrinkwrap.json'],
  }),
  '.npmignore': 'npm-shrinkwrap.json',
  'npm-shrinkwrap.json': '{}',
},
			[
    '.npmignore',
    'package.json',
  ]
		);
	});
});
