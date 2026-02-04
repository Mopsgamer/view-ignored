import { testStream } from "./0_testScan.test.js"
import { it } from "bun:test";
import { deepEqual } from "node:assert/strict";
import { Git as target } from "./targets/git.js";

it("stream() works for Git", async () => {
    await testStream({ 'file': "1", src: { file: "2" } }, ({stream}) => {
        const paths: string[] = []
        stream.addListener('dirent', (d) => {
            paths.push(d.match.kind)
            paths.push(d.path)
        })
        stream.once('end', () => {
            deepEqual(paths, [ "no-match", "file", "no-match", "src", "no-match", "src/file" ])
        })
    }, { target })
})