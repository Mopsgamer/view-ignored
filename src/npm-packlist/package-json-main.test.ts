import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("package-json-main", () => {
	test("follows npm package ignoring rules", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    name: 'test-package',
    version: '3.1.4',
    main: '__main.js',
    browser: 'browser.js',
    files: [
      'elf.js',
      'deps/foo/config/config.gypi',
    ],
  }),
  'elf.js': elfJS,
  '__main.js': elfJS,
  'browser.js': elfJS,
  '.npmrc': 'packaged=false',

  // don't bother even reading this file, because we have files list
  '.npmignore': '!.npmignore\n!dummy\npackage.json',
  dummy: 'foo',
  build: {
    'config.gypi': "i_wont_be_included='with any luck'",
    'npm-debug.log': '0 lol\n',
  },
  deps: {
    foo: {
      config: {
        'config.gypi': "i_will_be_included='with any luck'",
      },
    },
  },
  '.git': {
    gitstub: "won't fool git, also won't be included",
  },
  node_modules: {
    history: {
      'README.md': "please don't include me",
    },
  },
},
			[
    'deps/foo/config/config.gypi',
    '__main.js',
    'browser.js',
    'elf.js',
    'package.json',
  ]
		);
	});
});
