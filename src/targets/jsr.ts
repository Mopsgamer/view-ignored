import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractJsrJson,
	extractJsrJsonc,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { jsrManifestParse } from "./jsrManifest.js"

const extractors: Extractor[] = [
	{
		extract: extractJsrJson,
		path: "jsr.json",
	},
	{
		extract: extractJsrJsonc,
		path: "jsr.jsonc",
	},
]

const internal: Rule[] = [
	ruleCompile({
		compiled: null,
		excludes: true,
		pattern: [".git", ".DS_Store"],
	}),
]

/**
 * @since 0.6.0
 */
export const JSR: Target = <Target>{
	extractors,
	ignores: ruleTest,
	async init({ fs, cwd }) {
		const normalCwd = unixify(cwd)

		const tasks = extractors.map(async ({ path }) => {
			const data = await fs.promises.readFile(normalCwd + "/" + path)
			return { data, path }
		})

		try {
			const { data } = await Promise.any(tasks)
			const dist = jsrManifestParse(data.toString())

			if (!dist || typeof dist !== "object") {
				throw new Error("Manifest is empty or not an object")
			}
		} catch (error) {
			throw new Error("Error while initializing Deno: No valid manifest found", { cause: error })
		}
	},
	internalRules: internal,
	isIgnoreFile: (path) => extractors.some((e) => e.path === path),
	root: ".",
}
