import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist workspace", () => {
	test("respects workspace root ignore files", async (done) => {
		const tree = {
			".gitignore": "ignore-me",
			"ignore-me": "should be ignored",
			"package.json": JSON.stringify({
				main: "root.js",
				name: "workspace-root",
				version: "1.0.0",
				workspaces: ["./workspaces/foo"],
			}),
			"root.js": "console.log('hello')",
			workspaces: {
				".gitignore": "ignore-me-also",
				foo: {
					"child.js": "console.log('hello')",
					"ignore-me": "should be ignored",
					"ignore-me-also": "should also be ignored",
					"package.json": JSON.stringify({
						main: "child.js",
						name: "workspace-child",
						version: "1.0.0",
					}),
				},
				"ignore-me": "should be ignored",
				"ignore-me-also": "should also be ignored",
			},
		}

		// When packing workspace foo
		await testScan(done, tree, ["child.js", "package.json"], {
			target: makeNPM(),
			within: "workspaces/foo",
		})
	})

	test("packing a workspace root does not include children", async (done) => {
		const tree = {
			".gitignore": "ignore-me",
			"ignore-me": "should be ignored",
			"package.json": JSON.stringify({
				main: "root.js",
				name: "workspace-root",
				version: "1.0.0",
				workspaces: ["./workspaces/foo"],
			}),
			"root.js": "console.log('hello')",
			workspaces: {
				".gitignore": "ignore-me-also",
				foo: {
					"child.js": "console.log('hello')",
					"ignore-me": "should be ignored",
					"ignore-me-also": "should also be ignored",
					"package.json": JSON.stringify({
						main: "child.js",
						name: "workspace-child",
						version: "1.0.0",
					}),
				},
				"ignore-me": "should be ignored",
				"ignore-me-also": "should also be ignored",
			},
		}

		await testScan(done, tree, ["root.js", "package.json"], {
			target: makeNPM(),
		})
	})

	test(".gitignore is discarded if .npmignore exists outside of tree", async (done) => {
		const tree = {
			".gitignore": "dont-ignore-me",
			".npmignore": "only-ignore-me",
			"dont-ignore-me": "should not be ignored",
			"only-ignore-me": "should be ignored",
			"package.json": JSON.stringify({
				main: "root.js",
				name: "workspace-root",
				version: "1.0.0",
				workspaces: ["./workspaces/foo"],
			}),
			"root.js": "console.log('hello')",
			workspaces: {
				".gitignore": "dont-ignore-me-either",
				".npmignore": "ignore-me-also",
				"dont-ignore-me": "should not be ignored",
				"dont-ignore-me-either": "should not be ignored",
				foo: {
					"child.js": "console.log('hello')",
					"dont-ignore-me": "should not be ignored",
					"dont-ignore-me-either": "should not be ignored",
					"ignore-me-also": "should also be ignored",
					"only-ignore-me": "should be ignored",
					"package.json": JSON.stringify({
						main: "child.js",
						name: "workspace-child",
						version: "1.0.0",
					}),
				},
				"ignore-me-also": "should be ignored",
				"only-ignore-me": "should be ignored",
			},
		}

		await testScan(
			done,
			tree,
			["dont-ignore-me", "dont-ignore-me-either", "child.js", "package.json"],
			{
				target: makeNPM(),
				within: "workspaces/foo",
			},
		)
	})
})
