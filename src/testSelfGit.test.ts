import { describe, test, expect } from "bun:test"
import { $ } from "bun"

import { scan } from "./scan.js"
import { makeGit } from "./targets/git.js"
import { sortFirstFolders } from "./testSort.test.js"

describe.skipIf(!!process.env.TEST_NO_SELF)("Git", () => {
	test(
		"scans self",
		async () => {
			const files = gitFiles()
			const r = await scan({ fastInternal: true, target: makeGit() })
			// this test uses sortFirstFolders implementation
			// provided by https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
			// you can install this jsr package in your project
			// for sorting - new Set(sorted) keeps sorting :),
			// but your package and dependents should also declare
			// @jsr:registry=https://npm.jsr.io in .npmrc or something.
			expect(sortFirstFolders(r.paths.keys()).filter((path) => !path.endsWith("/"))).toMatchObject(
				sortFirstFolders(await files),
			)
		},
		{ timeout: 120e3 },
	)
})

async function gitFiles(): Promise<string[]> {
	const command = "git ls-files --others --exclude-standard --cached"
	const { stdout, stderr, exitCode } = await $`git ls-files --others --exclude-standard --cached`
		.env({ ...process.env, NO_COLOR: "1" })
		.quiet()
	const output = stdout.toString() + stderr.toString()

	if (exitCode !== 0) {
		throw new Error(`'${command}' exited with code ${exitCode}\n${output}`)
	}
	const files = output.trim().split("\n")
	return files
}
