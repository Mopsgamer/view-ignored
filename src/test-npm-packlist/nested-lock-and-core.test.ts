import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist nested-lock-and-core", () => {
	test("follows npm package ignoring rules", async (done) => {
		await testScan(
			done,
			{
				"bun.lock": JSON.stringify({
					include: false,
					lock: "file",
				}),
				"bun.lockb": JSON.stringify({
					include: false,
					lock: "file",
				}),
				core: {
					"include-me.txt": "please include me",
				},
				lib: {
					"bun.lock": JSON.stringify({
						include: true,
						lock: "file",
					}),
					"bun.lockb": JSON.stringify({
						include: true,
						lock: "file",
					}),
					core: "no longer excluded dump file",
					"package-lock.json": JSON.stringify({
						include: true,
						lock: "file",
					}),
					"yarn.lock": JSON.stringify({
						include: true,
						lock: "file",
					}),
				},
				"package-lock.json": JSON.stringify({
					include: false,
					lock: true,
				}),
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.2.3",
				}),
				"yarn.lock": JSON.stringify({
					include: false,
					lock: "file",
				}),
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
			{ target: makeNPM(), dirs: false },
		)
	})
})
