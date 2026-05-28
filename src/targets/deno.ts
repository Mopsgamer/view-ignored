import type { Extractor, Rule } from "../patterns/index.js"
import type { Target } from "./target.js"

import {
	makeJsrJsonExtractor,
	makeJsrJsoncExtractor,
	makePackageJsonExtractor,
	ruleCompile,
	ruleTest,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { jsrManifestParse } from "./jsrManifest.js"

const extractors: Extractor[] = [
	makeJsrJsonExtractor("deno.json"),
	makeJsrJsoncExtractor("deno.jsonc"),
	makeJsrJsonExtractor("jsr.json"),
	makeJsrJsoncExtractor("jsr.jsonc"),
	makePackageJsonExtractor("package.json"),
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
	root: ".",
}
