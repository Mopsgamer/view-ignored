import { describe, test } from "bun:test"
import { deepEqual } from "node:assert/strict"
import { getDepth } from "./getDepth.js"

describe("getDepth", () => {
	test("./", () => {
		deepEqual(getDepth(".", 9), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("./", 9), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth(".", 0), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("./", 0), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth(".", 1), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("./", 1), { depth: 0, depthSlash: -1 })
	})
	test("./test", () => {
		deepEqual(getDepth("test", 9), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("test/", 9), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("test", 0), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("test/", 0), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("test", 1), { depth: 0, depthSlash: -1 })
		deepEqual(getDepth("test/", 1), { depth: 0, depthSlash: -1 })
	})
	test("./a/b", () => {
		deepEqual(getDepth("a/b", 9), { depth: 1, depthSlash: -1 })
		deepEqual(getDepth("a/b/", 9), { depth: 1, depthSlash: -1 })
		deepEqual(getDepth("a/b", 0), { depth: 1, depthSlash: 1 })
		deepEqual(getDepth("a/b/", 0), { depth: 1, depthSlash: 1 })
		deepEqual(getDepth("a/b", 1), { depth: 1, depthSlash: -1 })
		deepEqual(getDepth("a/b/", 1), { depth: 1, depthSlash: -1 })
	})
	test("./a/b/c", () => {
		deepEqual(getDepth("a/b/c", 9), { depth: 2, depthSlash: -1 })
		deepEqual(getDepth("a/b/c/", 9), { depth: 2, depthSlash: -1 })
		deepEqual(getDepth("a/b/c", 0), { depth: 2, depthSlash: 1 })
		deepEqual(getDepth("a/b/c/", 0), { depth: 2, depthSlash: 1 })
		deepEqual(getDepth("a/b/c", 1), { depth: 2, depthSlash: 3 })
		deepEqual(getDepth("a/b/c/", 1), { depth: 2, depthSlash: 3 })
		deepEqual(getDepth("out/targets/index.js", 1), { depth: 2, depthSlash: 11 })
	})
})
