import { type } from "arktype"

import type { Target } from "./target.js"

import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
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

const internal: SignedPattern[] = [
	signedPatternCompile({
		excludes: true,
		pattern: [".git", ".DS_Store"],
		compiled: null,
	}),
]

/**
 * @since 0.6.0
 */
export const JSR: Target = {
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
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: JSR,
		})
	},
}
