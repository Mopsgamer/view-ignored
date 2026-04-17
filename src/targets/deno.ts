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
		let content: Buffer
		const normalCwd = unixify(cwd)
		let path: string
		for (const [i, { path: p }] of extractors.entries()) {
			path = p
			try {
				content = await fs.promises.readFile(normalCwd + "/" + path)
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					if (i < extractors.length - 1) {
						continue
					}
				}
				throw new Error("Error while initializing Deno", { cause: error })
			}
		}

		const dist = jsrManifestParse(content!.toString())
		if (dist instanceof type.errors) {
			throw new Error("Invalid '" + path! + "': " + dist.summary, { cause: dist })
		}
	},
	internalRules: internal,
	root: ".",
}
