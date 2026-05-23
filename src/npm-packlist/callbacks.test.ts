/* eslint-disable sort-keys */
import { describe, test, expect } from "bun:test"
import { Volume } from "memfs"
import * as path from "node:path"

import { scanCb } from "../scan.js"
import { NPM as target } from "../targets/npm.js"
import { createAdapter } from "../test-utils.js"

describe("callbacks", () => {
	/**
	 * @see https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/callbacks.js#L14
	 */
	test("export supports callbacks", () => {
		const tree = {
			"package.json": JSON.stringify({
				name: "test",
			}),
		}
		const cwd = "/test"
		const vol = Volume.fromNestedJSON(tree, cwd)
		const adapter = createAdapter(vol)

		return new Promise<void>((resolve, reject) => {
			scanCb({ cwd, fs: adapter, target }, (err, ctx) => {
				if (err) {
					reject(err)
					return
				}
				const results = Array.from(ctx.paths.entries())
					.filter(([p, match]) => !match.ignored && !p.endsWith("/"))
					.map(([p, _]) => path.relative(cwd, p).replace(/\\/g, "/"))
					.filter((p) => p !== "")

				expect(results.sort()).toEqual(["package.json"])
				resolve()
			})
		})
	})
})
