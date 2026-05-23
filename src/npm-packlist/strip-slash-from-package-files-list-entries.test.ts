/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("strip-slash-from-package-files-list-entries", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/strip-slash-from-package-files-list-entries.js#L7
	test("should strip / from package.json files array entry results", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [
						// include without slash, then exclude with it
						"somedir",
						"!somedir/",

						// other way around
						"otherdir/",
						"!otherdir",

						// now including it that way
						"!incldir/",
						"incldir",

						// exclude without slash, then include with it
						"!dist",
						"dist/",
						"!dist/foo/*.src",
					],
				}),
				otherdir: {
					donotinclude: "",
				},
				somedir: {
					donotinclude: "",
				},
				incldir: {
					yesinclude: "",
				},
				foo: "",
				dist: {
					foo: {
						"foo.src": "",
						"foo.result": "",
					},
					bar: "",
					baz: {
						boo: "",
						"boo.src": "",
					},
				},
			},
			[
				"dist/bar",
				"dist/baz/boo",
				"incldir/yesinclude",
				"package.json",
				"dist/foo/foo.result",
				"dist/baz/boo.src",
			],
			{},
		))
})
