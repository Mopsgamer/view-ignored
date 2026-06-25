import { describe, test, expect } from "bun:test"

import { scanCb } from "./scan.js"
import { makeGit } from "./targets/git.js"

describe("scanCb", () => {
	test("scanCb works", (done) => {
		scanCb({ target: makeGit() }, (err, ctx) => {
			try {
				expect(err).toBeNull()
				expect(ctx).toBeDefined()
				expect(ctx.paths).toBeDefined()
				done()
			} catch (e) {
				done(e)
			}
		})
	})

	test("scanCb handles error (invalid depth)", (done) => {
		// @ts-expect-error testing invalid input
		scanCb({ depth: -1, target: makeGit() }, (err, ctx) => {
			try {
				expect(err).toBeInstanceOf(TypeError)
				expect(err?.message).toBe("Depth must be a non-negative integer")
				expect(ctx).toBeNull()
				done()
			} catch (e) {
				done(e)
			}
		})
	})

	test("scanCb uses default fs and cwd", (done) => {
		scanCb({ target: makeGit() }, (err, ctx) => {
			try {
				expect(err).toBeNull()
				expect(ctx).toBeDefined()
				// It should have scanned the current directory
				done()
			} catch (e) {
				done(e)
			}
		})
	})
})
