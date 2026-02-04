import { testStream } from "./0_testScan.test.js"
import { describe, it } from "bun:test"
import { deepEqual } from "node:assert/strict"
import { Git as target } from "./targets/git.js"

describe("Git", () => {
	it("scanStream no file", async (done) => {
		await testStream(
			{ file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: string[] = []
				stream.addListener("dirent", (d) => {
					paths.push(d.match.kind)
					paths.push(d.path)
				})
				stream.once("end", () => {
					deepEqual(paths, ["no-match", "file", "no-match", "src", "no-match", "src/file"])
					done()
				})
			},
			{ target },
		)
	})
	it("scanStream .gitignore", async (done) => {
		await testStream(
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
						"src",
						"external", // ignored
						"src/file",
						"no-match", // included
						".gitignore",
						"internal", // ignored internal
						".git",
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
