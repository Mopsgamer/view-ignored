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
	init({ fs, cwd }, cb) {
		const normalCwd = unixify(cwd)

		let i = 0
		function next() {
			if (i >= extractors.length) {
				cb(new Error("Error while initializing JSR: No valid manifest found"))
				return
			}
			const extractor = extractors[i++]!
			fs.readFile(normalCwd + "/" + extractor.path, (err, data) => {
				if (err) {
					next()
					return
				}
				try {
					jsrManifestParse(data!.toString())
				} catch (error) {
					cb(new Error("Invalid '" + extractor.path + "'", { cause: error }))
					return
				}
				cb()
			})
		}
		next()
	},
	internalRules: internal,
	isIgnoreFile: (path) => extractors.some((e) => e.path === path),
	root: ".",
}
