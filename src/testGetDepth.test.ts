import { describe, test, expect } from "bun:test"

import { getDepth } from "./getDepth.js"

describe("getDepth", () => {
	test("./", () => {
		expect(getDepth(".", 9)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("./", 9)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth(".", 0)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("./", 0)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth(".", 1)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("./", 1)).toStrictEqual({ depth: 0, depthSlash: -1 })
	})
	test("./test", () => {
		expect(getDepth("test", 9)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("test/", 9)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("test", 0)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("test/", 0)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("test", 1)).toStrictEqual({ depth: 0, depthSlash: -1 })
		expect(getDepth("test/", 1)).toStrictEqual({ depth: 0, depthSlash: -1 })
	})
	test("./a/b", () => {
		expect(getDepth("a/b", 9)).toStrictEqual({ depth: 1, depthSlash: -1 })
		expect(getDepth("a/b/", 9)).toStrictEqual({ depth: 1, depthSlash: -1 })
		expect(getDepth("a/b", 0)).toStrictEqual({ depth: 1, depthSlash: 1 })
		expect(getDepth("a/b/", 0)).toStrictEqual({ depth: 1, depthSlash: 1 })
		expect(getDepth("a/b", 1)).toStrictEqual({ depth: 1, depthSlash: -1 })
		expect(getDepth("a/b/", 1)).toStrictEqual({ depth: 1, depthSlash: -1 })
	})
	test("./a/b/c", () => {
		expect(getDepth("a/b/c", 9)).toStrictEqual({ depth: 2, depthSlash: -1 })
		expect(getDepth("a/b/c/", 9)).toStrictEqual({ depth: 2, depthSlash: -1 })
		expect(getDepth("a/b/c", 0)).toStrictEqual({ depth: 2, depthSlash: 1 })
		expect(getDepth("a/b/c/", 0)).toStrictEqual({ depth: 2, depthSlash: 1 })
		expect(getDepth("a/b/c", 1)).toStrictEqual({ depth: 2, depthSlash: 3 })
		expect(getDepth("a/b/c/", 1)).toStrictEqual({ depth: 2, depthSlash: 3 })
		expect(getDepth("out/targets/index.js", 1)).toStrictEqual({ depth: 2, depthSlash: 11 })
	})
})
