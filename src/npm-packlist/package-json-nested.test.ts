import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("package-json-nested", () => {
	test("includes nested package.json file", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    name: 'test-package',
    version: '1.2.3',
  }),
  nest: {
    'package.json': JSON.stringify({
      name: 'nested-package',
      version: '1.2.3',
      files: ['index.js'],
    }),
    'index.js': 'console.log("hi")',
    'foo.js': 'console.log("no")',
  },
},
			[
    'nest/foo.js',
    'nest/index.js',
    'nest/package.json',
    'package.json',
  ]
		);
	});
});
