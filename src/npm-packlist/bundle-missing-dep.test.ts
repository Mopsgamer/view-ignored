import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("bundle-missing-dep", () => {
	test("skips bundling deps with missing edges", async () => {
		await runPacklistTest(
			{
    'package.json': JSON.stringify({
      name: 'test',
      version: '1.0.0',
      main: 'index.js',
      // named in bundleDependencies, but not actually a dependency
      bundleDependencies: ['history'],
    }),
    'index.js': '',
    node_modules: {
      history: {
        'package.json': JSON.stringify({
          name: 'history',
          version: '1.0.0',
          main: 'index.js',
        }),
        'index.js': '',
      },
    },
  },
			[
    'index.js',
    'package.json',
  ]
		);
	});
});
