import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"
import { elfJS, bin } from "../test-utils.js"

describe("include-gitignore", () => {
	test("follows npm package ignoring rules", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    name: 'test-package',
    version: '3.1.4',
    main: 'elf.js',
  }),
  z: {
    '.gitignore': '!.gitignore',
  },
  '.DS_Store': 'do not include me',
  'elf.js': elfJS,
  '.npmrc': 'packaged=false',
  '.npmignore': '.npmignore\ndummy\npackage.json',
  dummy: 'foo',
  build: {
    'config.gypi': "i_wont_be_included='with any luck'",
    'npm-debug.log': '0 lol\n',
  },
  deps: {
    foo: {
      config: {
        'config.gypi': "i_wont_be_included='with any luck'",
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
    'z/.gitignore',
    'deps/foo/config/config.gypi',
    'elf.js',
    'package.json',
  ]
		);
	});
});
