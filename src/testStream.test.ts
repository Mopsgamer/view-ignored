import { describe, test, expect } from "bun:test"

import { RuleMatchKind } from "./patterns/rule.js"
import { Git as target } from "./targets/git.js"
import { testStream } from "./testScan.test.js"

describe("Git", () => {
	test("scanStream no file", async (done) => {
		await testStream(
			{ file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: (string | number)[] = []
				stream.addListener("dirent", (d) => {
					paths.push(d.match.kind)
					paths.push(d.path)
				})
				stream.once("end", () => {
					expect(paths).toMatchObject([
						RuleMatchKind.missingSource,
						"file",
						RuleMatchKind.missingSource,
						"src/",
						RuleMatchKind.missingSource,
						"src/file",
					])
					done()
				})
			},
			{ target },
		)
	})
	test("scanStream .gitignore", async (done) => {
		await testStream(
			{ ".git": { HEAD: "" }, ".gitignore": "file", file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: (string | number)[] = []
				stream.addListener("dirent", (d) => {
					paths.push(d.match.kind)
					paths.push(d.path)
				})
				stream.once("end", () => {
					expect(paths).toMatchObject([
						RuleMatchKind.external, // ignored
						"file",
						RuleMatchKind.noMatch, // included
						"src/",
						RuleMatchKind.external, // ignored
						"src/file",
						RuleMatchKind.noMatch, // included
						".gitignore",
						RuleMatchKind.internal, // ignored internal
						".git/",
						RuleMatchKind.internal, // ignored internal
						".git/HEAD",
					])
					done()
				})
			},
			{ target },
		)
	})
})
