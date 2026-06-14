import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractJsrJson,
	extractPackageJson,
} from "../patterns/index.js"
import { jsrManifestParse } from "./jsrManifest.js"

/**
 * @since 0.11.2
 */
export function makeDeno(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractJsrJson,
			path: "deno.json",
		},
		{
			extract: extractJsrJson,
			path: "deno.jsonc",
		},
		{
			extract: extractJsrJson,
			path: "jsr.json",
		},
		{
			extract: extractJsrJson,
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

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			let i = 0
			function next() {
				if (i >= extractors.length) {
					cb(new Error("Error while initializing Deno: No valid manifest found"))
					return
				}
				const extractor = extractors[i++]!
				fs.readFile(cwd + "/" + extractor.path, (err, data) => {
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
					cb(null)
				})
			}
			next()
		},
		internalRules: internal,
		needsSource: true,
		root: ".",
	}
}
