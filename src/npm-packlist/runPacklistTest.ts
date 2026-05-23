import { expect } from "bun:test"
import { Volume } from "memfs"
import * as path from "node:path"

import { scan, type ScanOptions } from "../scan.js"
import { NPM as target } from "../targets/npm.js"
import { createAdapter, populateVolume, type TestTree } from "../test-utils.js"

export async function runPacklistTest(
	tree: TestTree,
	expected: string[],
	options: Partial<ScanOptions> = {},
) {
	const base = "/test"
	const vol = new Volume()
	populateVolume(vol, tree, base)
	const adapter = createAdapter(vol)

	const cwd = options.cwd
		? path.isAbsolute(options.cwd)
			? options.cwd
			: path.join(base, options.cwd)
		: base

	const ctx = await scan({
		fs: adapter,
		target,
		...options,
		cwd,
	})

	const results = Array.from(ctx.paths.entries())
		.filter(([p, match]) => !match.ignored && !p.endsWith("/"))
		.map(([p, _]) => {
			const relative = path.relative(cwd, p)
			return relative.replace(/\\/g, "/")
		})
		.filter((p) => p !== "")

	expect(results.sort()).toEqual(expected.sort())
}
