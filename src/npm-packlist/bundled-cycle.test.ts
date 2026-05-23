import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("bundled-cycle", () => {
	test("correctly bundles cyclic deps", async () => {
		await runPacklistTest(
			{
    'package.json': JSON.stringify({
      name: 'root',
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        a: '1.0.0',
      },
      bundleDependencies: ['a'],
    }),
    'index.js': '',
    node_modules: {
      a: {
        'package.json': JSON.stringify({
          name: 'a',
          version: '1.0.0',
          main: 'index.js',
          dependencies: {
            b: '1.0.0',
          },
        }),
        'index.js': '',
      },
      b: {
        'package.json': JSON.stringify({
          name: 'b',
          version: '1.0.0',
          main: 'index.js',
          dependencies: {
            a: '1.0.0',
          },
        }),
        'index.js': '',
      },
    },
  },
			[
    'index.js',
    'node_modules/a/index.js',
    'node_modules/b/index.js',
    'node_modules/a/package.json',
    'node_modules/b/package.json',
    'package.json',
  ]
		);
	});
});
