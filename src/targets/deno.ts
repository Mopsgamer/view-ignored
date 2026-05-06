import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractJsrJson,
	extractJsrJsonc,
	extractPackageJson,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { jsrManifestParse } from "./jsrManifest.js"

const extractors: Extractor[] = [
	{
		extract: extractJsrJson,
		path: "deno.json",
	},
	{
		extract: extractJsrJsonc,
		path: "deno.jsonc",
	},
	{
		extract: extractJsrJson,
		path: "jsr.json",
	},
	{
		extract: extractJsrJsonc,
		path: "jsr.jsonc",
	},
	{
		extract: extractPackageJson,
		path: "package.json",
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
 * @since 0.8.1
 */
export const Deno: Target = <Target>{
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
