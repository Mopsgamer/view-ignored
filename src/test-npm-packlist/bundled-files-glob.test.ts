import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)(
	'npm-packlist bundled dep with files: ["dist-*"]',
	() => {
		test("expands directory matches", async (done) => {
			await testScan(
				done,
				{
					"index.js": "",
					node_modules: {
						bundled: {
							"dist-cjs": { "index.js": "cjs" },
							"dist-es": { "index.js": "es" },
							"dist-other.js": "other",
							"package.json": JSON.stringify({
								files: ["dist-*"],
								name: "bundled",
								version: "1.0.0",
							}),
							"should-not-pack.js": "nope",
						},
					},
					"package.json": JSON.stringify({
						bundleDependencies: ["bundled"],
						dependencies: {
							bundled: "1.0.0",
						},
						main: "index.js",
						name: "root",
						version: "1.0.0",
					}),
				},
				[
					"index.js",
					"node_modules/bundled/dist-cjs/index.js",
					"node_modules/bundled/dist-es/index.js",
					"node_modules/bundled/dist-other.js",
					"node_modules/bundled/package.json",
					"package.json",
				],
				{ target: makeNPM() },
			)
		})
	},
)
