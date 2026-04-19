import { type } from "arktype"

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
export const JSR: Target = {
	extractors,
	ignores: ruleTest,
	async init({ fs, cwd }) {
		const normalCwd = unixify(cwd)

		const tasks = extractors.map(async ({ path: p }) => {
			const fullPath = normalCwd + "/" + p
			const content = await fs.promises.readFile(fullPath)
			return { content, path: p }
		})

		try {
			const { content, path } = await Promise.any(tasks)

			const dist = jsrManifestParse(content.toString())
			if (dist instanceof type.errors) {
				throw new Error("Invalid '" + path + "': " + dist.summary, { cause: dist })
			}
		} catch (error) {
			throw new Error("Error while initializing Deno: No valid extractors found", { cause: error })
		}
	},
	internalRules: internal,
	root: ".",
}
