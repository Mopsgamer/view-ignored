import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)(
	"npm-packlist package-json-files-wildcard-strict-defaults",
	() => {
		test("wildcard files[] does not override strict default ignores", async (done) => {
			await testScan(
				done,
				{
					".git": {
						HEAD: "ref: refs/heads/main\n",
						config: "[core]\n",
					},
					".npmrc": "always-auth=true\n",
					"README.md": "# wildcard files test\n",
					node_modules: {
						foo: {
							"index.js": 'module.exports = "foo"\n',
							"package.json": JSON.stringify({ name: "foo", version: "1.0.0" }),
						},
					},
					"package.json": JSON.stringify({
						files: ["**/*"],
						name: "test-package",
						version: "1.0.0",
					}),
					src: {
						".hidden.js": 'module.exports = "hidden"\n',
						"index.js": 'module.exports = "src"\n',
					},
				},
				["src/.hidden.js", "src/index.js", "package.json", "README.md"],
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
