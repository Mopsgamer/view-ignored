/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("nested-lock-and-core", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/nested-lock-and-core.js#L52
	test("follows npm package ignoring rules", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.2.3",
				}),
				"package-lock.json": JSON.stringify({
					lock: true,
					include: false,
				}),
				"yarn.lock": JSON.stringify({
					lock: "file",
					include: false,
				}),
				"bun.lockb": JSON.stringify({
					lock: "file",
					include: false,
				}),
				"bun.lock": JSON.stringify({
					lock: "file",
					include: false,
				}),
				lib: {
					core: "no longer excluded dump file",
					"package-lock.json": JSON.stringify({
						lock: "file",
						include: true,
					}),
					"yarn.lock": JSON.stringify({
						lock: "file",
						include: true,
					}),
					"bun.lockb": JSON.stringify({
						lock: "file",
						include: true,
					}),
					"bun.lock": JSON.stringify({
						lock: "file",
						include: true,
					}),
				},
				core: {
					"include-me.txt": "please include me",
				},
			},
			[
				"lib/core",
				"lib/package-lock.json",
				"package.json",
				"lib/bun.lock",
				"lib/yarn.lock",
				"lib/bun.lockb",
				"core/include-me.txt",
			],
			{},
		))
})
