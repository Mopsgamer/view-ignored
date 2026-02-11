import { describe, test, expect } from "bun:test"

import { Git as target } from "./targets/git.js"
import { testStream } from "./testScan.test.js"

describe("Git", () => {
	test("scanStream no file", async (done) => {
		await testStream(
			{ file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: string[] = []
				stream.addListener("dirent", (d) => {
					paths.push(d.match.kind)
					paths.push(d.path)
				})
				stream.once("end", () => {
					expect(paths).toMatchObject([
						"missing-source",
						"file",
						"missing-source",
						"src/",
						"missing-source",
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
			{ file: "1", src: { file: "2" }, ".gitignore": "file", ".git": { HEAD: "" } },
			({ stream }) => {
				const paths: string[] = []
				stream.addListener("dirent", (d) => {
					paths.push(d.match.kind)
					paths.push(d.path)
				})
				stream.once("end", () => {
					expect(paths).toMatchObject([
						"external", // ignored
						"file",
						"no-match", // included
						"src/",
						"external", // ignored
						"src/file",
						"no-match", // included
						".gitignore",
						"internal", // ignored internal
						".git/",
						"internal", // ignored internal
						".git/HEAD",
					])
					done()
				})
			},
			{ target },
		)
	})
})
