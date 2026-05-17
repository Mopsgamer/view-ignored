import { describe, test, expect } from "bun:test"

import { RuleMatchKind } from "./patterns/rule.js"
import { Git as target } from "./targets/git.js"
import { testStream } from "./testScan.test.js"

describe("Git", () => {
	test("scanStream no file", async (done) => {
		await testStream(
			{ file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: { kind: number; path: string }[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push({ kind: d.match.kind, path: d.path })
				})
				stream.addEventListener(
					"end",
					() => {
						expect(paths.sort((a, b) => a.path.localeCompare(b.path))).toMatchObject(
							[
								{ kind: RuleMatchKind.missingSource, path: "file" },
								{ kind: RuleMatchKind.missingSource, path: "src/" },
								{ kind: RuleMatchKind.missingSource, path: "src/" },
								{ kind: RuleMatchKind.missingSource, path: "src/file" },
							].sort((a, b) => a.path.localeCompare(b.path)),
						)
						done()
					},
					{ once: true },
				)
			},
			{ target },
		)
	})
	test("scanStream .gitignore", async (done) => {
		await testStream(
			{ ".git": { HEAD: "" }, ".gitignore": "file", file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: { kind: number; path: string }[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push({ kind: d.match.kind, path: d.path })
				})
				stream.addEventListener(
					"end",
					() => {
						expect(paths.sort((a, b) => a.path.localeCompare(b.path))).toMatchObject(
							[
								{ kind: RuleMatchKind.external, path: "file" },
								{ kind: RuleMatchKind.noMatch, path: "src/" },
								{ kind: RuleMatchKind.external, path: "src/file" },
								{ kind: RuleMatchKind.noMatch, path: ".gitignore" },
								{ kind: RuleMatchKind.internal, path: ".git/" },
								{ kind: RuleMatchKind.internal, path: ".git/HEAD" },
							].sort((a, b) => a.path.localeCompare(b.path)),
						)
						done()
					},
					{ once: true },
				)
			},
			{ target },
		)
	})
})
