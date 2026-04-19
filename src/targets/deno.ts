import { type } from "arktype"

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
export const Deno: Target = {
	extractors,
	ignores: ruleTest,
	async init({ fs, cwd }) {
		const normalCwd = unixify(cwd)

		const results = await Promise.allSettled(
			extractors.map(async ({ path: p }) => {
				const data = await fs.promises.readFile(normalCwd + "/" + p)
				return { data, p }
			}),
		)

		const successful = results.find((r) => r.status === "fulfilled")

		if (!successful) {
			const firstError = (results[0] as PromiseRejectedResult).reason
			throw new Error("Error while initializing Deno", { cause: firstError })
		}

		const { data: content, p: path } = successful.value
		const dist = jsrManifestParse(content.toString())

		if (dist instanceof type.errors) {
			throw new Error("Invalid '" + path + "': " + dist.summary, { cause: dist })
		}
	},
	internalRules: internal,
	root: ".",
}
