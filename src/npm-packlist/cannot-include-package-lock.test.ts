import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("cannot-include-package-lock", () => {
	test("try to include package-lock.json but cannot", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    files: ['.npmignore', 'package-lock.json'],
  }),
  '.npmignore': `
!package-lock.json
`,
  'package-lock.json': '{}',
},
			[
    '.npmignore',
    'package.json',
  ]
		);
	});
});
