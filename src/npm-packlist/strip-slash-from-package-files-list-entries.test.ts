import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

const elfJS = "module.exports = elf => console.log(\"i'm a elf\")";

describe("strip-slash-from-package-files-list-entries", () => {
	test("should strip / from package.json files array entry results", async () => {
		await runPacklistTest(
			{
    'package.json': JSON.stringify({
      files: [
        // include without slash, then exclude with it
        'somedir',
        '!somedir/',

        // other way around
        'otherdir/',
        '!otherdir',

        // now including it that way
        '!incldir/',
        'incldir',

        // exclude without slash, then include with it
        '!dist',
        'dist/',
        '!dist/foo/*.src',
      ],
    }),
    otherdir: {
      donotinclude: '',
    },
    somedir: {
      donotinclude: '',
    },
    incldir: {
      yesinclude: '',
    },
    foo: '',
    dist: {
      foo: {
        'foo.src': '',
        'foo.result': '',
      },
      bar: '',
      baz: {
        boo: '',
        'boo.src': '',
      },
    },
  },
			[
    'dist/bar',
    'dist/baz/boo',
    'incldir/yesinclude',
    'package.json',
    'dist/foo/foo.result',
    'dist/baz/boo.src',
  ]
		);
	});
});
