import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)(
	"npm-packlist strip-slash-from-package-files-list-entries",
	() => {
		test("should strip / from package.json files array entry results", async (done) => {
			await testScan(
				done,
				{
					dist: {
						bar: "",
						baz: {
							boo: "",
							"boo.src": "",
						},
						foo: {
							"foo.result": "",
							"foo.src": "",
						},
					},
					foo: "",
					incldir: {
						yesinclude: "",
					},
					otherdir: {
						donotinclude: "",
					},
					"package.json": JSON.stringify({
						files: [
							"somedir",
							"!somedir/",
							"otherdir/",
							"!otherdir",
							"!incldir/",
							"incldir",
							"!dist",
							"dist/",
							"!dist/foo/*.src",
						],
						name: "test-package",
						version: "1.0.0",
					}),
					somedir: {
						donotinclude: "",
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
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
