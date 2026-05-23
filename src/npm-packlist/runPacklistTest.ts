import { expect } from "bun:test"
import { Volume, type NestedDirectoryJSON } from "memfs"
import * as path from "node:path"
import { scan } from "../browser_scan.js"
import { NPM as target } from "../targets/npm.js"
import { createAdapter } from "../testScan.test.ts"

export async function runPacklistTest(
	tree: NestedDirectoryJSON,
	expected: string[],
	options: {
		prefix?: string
		workspaces?: string[]
	} = {},
) {
	const cwd = "/test"
	const vol = Volume.fromNestedJSON(tree, cwd)
	const adapter = createAdapter(vol)

	const ctx = await scan({
		cwd,
		fs: adapter,
		target,
		// In view-ignored, we might need to pass these through or handle them
		// for now we just pass them to see if it works
		...options,
	} as any)

	const results = Array.from(ctx.paths.entries())
		.filter(([_, match]) => !match.ignored && !match.isDir)
		.map(([p, _]) => {
			const relative = path.relative(cwd, p)
			return relative.replace(/\\/g, "/")
		})
		.filter((p) => p !== "")

	expect(results.sort()).toEqual(expected.sort())
}
