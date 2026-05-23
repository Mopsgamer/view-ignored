import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("package-json-roots-and-nests", () => {
	test("package with negated files", async () => {
		await runPacklistTest(
			{
  'package.json': JSON.stringify({
    bin: 'bin.js',
    main: 'main.js',
    browser: 'browser.js',
    dependencies: {
      foo: '1.0.0',
      '@foo/bar': '1.0.0',
    },
    bundleDependencies: [
      'foo',
      '@foo/bar',
    ],
  }),
  node_modules: {
    // bundle dep files are ALWAYS included
    // even questionable things
    foo: {
      'package-lock.json': 'include',
    },
    '@foo': {
      bar: {
        '.DS_Store': 'not this tho',
      },
    },
  },
  lib: {
    // these are not included
    'package-lock.json': 'sw',
    'package.json.js': '{}',
    'bin.js': 'bin',
    'main.js': 'main',
    'browser.js': 'browser',
    'npm-shrinkwrap.json': 'sw',
  },

  // these get included
  'bin.js': 'bin',
  'main.js': 'main',
  'browser.js': 'browser',
  inc: {
    'package.json': JSON.stringify({ files: [] }),
    'package-lock.json': 'include me plz',
    foo: 'include me plz',
  },

  // these do not
  '.npmignore': 'lib/*',
  'package-lock.json': 'sw',
},
			[
    'node_modules/@foo/bar/.DS_Store',
    'inc/foo',
    'bin.js',
    'browser.js',
    'main.js',
    'inc/package-lock.json',
    'node_modules/foo/package-lock.json',
    'inc/package.json',
    'package.json',
  ]
		);
	});
});
