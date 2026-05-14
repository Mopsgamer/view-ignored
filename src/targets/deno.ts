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
	init({ fs, cwd }, cb) {
		const normalCwd = unixify(cwd)

		let i = 0
		function next() {
			if (i >= extractors.length) {
				cb(new Error("Error while initializing Deno: No valid manifest found"))
				return
			}
			const extractor = extractors[i++]
			fs.readFile(normalCwd + "/" + extractor.path, (err, data) => {
				if (err) {
					next()
					return
				}
				try {
					const dist = jsrManifestParse(data!.toString())
					if (!dist || typeof dist !== "object") {
						next()
						return
					}
					cb()
				} catch {
					next()
				}
			})
		}
		next()
	},
	internalRules: internal,
	isIgnoreFile: (path) => extractors.some((e) => e.path === path),
	root: ".",
}
