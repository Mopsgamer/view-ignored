import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("package-json-bin-multiple", () => {
	test("follows npm package ignoring rules", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    name: 'test-package',
    version: '1.6.2',
    bin: {
      bar: '__bin_bar',
      foo: '__bin_foo',
    },
    files: [
      'lib',
    ],
  }),
  __bin_foo: bin,
  __bin_bar: bin,
  lib: {
    'elf.js': elfJS,
  },
  dummy: 'ignore this',
},
			[
    '__bin_bar',
    '__bin_foo',
    'lib/elf.js',
    'package.json',
  ]
		);
	});
});
