import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("workspace", () => {
	test("respects workspace root ignore files", async () => {
		await runPacklistTest(
			{
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
			},
			["child.js", "package.json"],
			{},
		)
	})
	test("packing a workspace root does not include children", async () => {
		await runPacklistTest(
			{
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
			},
			["root.js", "package.json"],
			{},
		)
	})
	test(".gitignore is discarded if .npmignore exists outside of tree", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "workspace-root",
					version: "1.0.0",
					main: "root.js",
					workspaces: ["./workspaces/foo"],
				}),
				"root.js": `console.log('hello')`,
				".gitignore": "dont-ignore-me",
				".npmignore": "only-ignore-me",
				"dont-ignore-me": "should not be ignored",
				"only-ignore-me": "should be ignored",
				workspaces: {
					".gitignore": "dont-ignore-me-either",
					".npmignore": "ignore-me-also",
					"dont-ignore-me": "should not be ignored",
					"dont-ignore-me-either": "should not be ignored",
					"only-ignore-me": "should be ignored",
					"ignore-me-also": "should be ignored",
					foo: {
						"package.json": JSON.stringify({
							name: "workspace-child",
							version: "1.0.0",
							main: "child.js",
						}),
						"child.js": `console.log('hello')`,
						"dont-ignore-me": "should not be ignored",
						"dont-ignore-me-either": "should not be ignored",
						"only-ignore-me": "should be ignored",
						"ignore-me-also": "should also be ignored",
					},
				},
			},
			["dont-ignore-me", "dont-ignore-me-either", "child.js", "package.json"],
			{},
		)
	})
})
