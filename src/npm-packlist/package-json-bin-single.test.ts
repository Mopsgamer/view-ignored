import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("package-json-bin-single", () => {
	test("follows npm package ignoring rules", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    name: 'test-package',
    version: '1.6.2',
    bin: '__bin',
    files: [
      'lib',
    ],
  }),
  __bin: bin,
  lib: {
    'elf.js': elfJS,
  },
  dummy: 'ignore',
},
			[
    '__bin',
    'lib/elf.js',
    'package.json',
  ]
		);
	});
});
