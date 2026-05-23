import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

describe("npm-packlist batch 4 (workspaces)", () => {
	test("respects workspace root ignore files", async () => {
		// Note: the original test used Arborist to load the tree.
		// Here we just mock the file structure.
		const tree = {
			"package.json": JSON.stringify({
				name: "workspace-root",
				version: "1.0.0",
				main: "root.js",
				workspaces: ["./workspaces/foo"],
			}),
			"root.js": `console.log('hello')`,
			".gitignore": "ignore-me",
			"ignore-me": "should be ignored",
			workspaces: {
				".gitignore": "ignore-me-also",
				"ignore-me": "should be ignored",
				"ignore-me-also": "should also be ignored",
				foo: {
					"package.json": JSON.stringify({
						name: "workspace-child",
						version: "1.0.0",
						main: "child.js",
					}),
					"child.js": `console.log('hello')`,
					"ignore-me": "should be ignored",
					"ignore-me-also": "should also be ignored",
				},
			},
		}

		await runPacklistTest(tree, ["child.js", "package.json"], {
			workspaces: ["/test/workspaces/foo"],
		})
	})
})
