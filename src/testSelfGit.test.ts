import { $ } from "bun"
import { describe, expect, test } from "bun:test"

import { scan } from "./scan.js"
import { Git as target } from "./targets/git.js"
import { sortFirstFolders } from "./testSort.test.js"

describe.skipIf(!!process.env.TEST_NO_SELF)("Git", () => {
	test(
		"scans self",
		async () => {
			const files = gitFiles()
			const r = await scan({ skipInternal: true, target })
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
	// .nothrow() ensures Bun won't reject the promise on a non-zero exit code
	const result = await $`git ls-files --others --exclude-standard --cached`
		.env({ ...process.env, NO_COLOR: "1" })
		.quiet()
		.nothrow()

	const output = result.text().trim()

	if (result.exitCode !== 0) {
		console.error(
			`'git ls-files --others --exclude-standard --cached' exited with code ${result.exitCode}\n${output}`,
		)
		return []
	}

	// Handle the case where the repository has no matching files to avoid returning ['']
	if (!output) {
		return []
	}

	return output.split("\n")
}
