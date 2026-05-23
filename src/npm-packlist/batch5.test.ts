import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

describe("npm-packlist batch 5 (miscellaneous)", () => {
	test("sorting.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["z", "a"],
				}),
				z: "",
				a: "",
			},
			["a", "package.json", "z"],
		)
	})
})
