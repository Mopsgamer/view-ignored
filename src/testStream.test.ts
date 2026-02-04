import { testStream } from "./testScan.test.js"
import { describe, test } from "bun:test"
import { deepEqual } from "node:assert/strict"
import { Git as target } from "./targets/git.js"

describe("Git", () => {
	test("scanStream no file", async (done) => {
		await testStream(
			done,
			{ file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: string[] = []
				stream.addListener("dirent", (d) => {
					paths.push(d.match.kind)
					paths.push(d.path)
				})
				stream.once("end", () => {
					deepEqual(paths, ["no-match", "file", "no-match", "src/", "no-match", "src/file"])
					done()
				})
			},
			{ target },
		)
	})
	test("scanStream .gitignore", async (done) => {
		await testStream(
			done,
			{ file: "1", src: { file: "2" }, ".gitignore": "file", ".git": { HEAD: "" } },
			({ stream }) => {
				const paths: string[] = []
				stream.addListener("dirent", (d) => {
					paths.push(d.match.kind)
					paths.push(d.path)
				})
				stream.once("end", () => {
					deepEqual(paths, [
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
