import type { Extractor } from "../patterns/extractor.js"
import type { InitCb } from "../patterns/init.js"

import { isArrayOfStrings } from "./npmManifest.js"

export function makeJsrInit(name: string, extractors: Extractor[]): InitCb {
	return ({ fs, cwd }, cb) => {
		let i = 0
		function next() {
			if (i >= extractors.length) {
				cb(new Error("Error while initializing " + name + ": No valid manifest found"))
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
	}
}

export interface JsrPublishConfig {
	include?: string[]
	exclude?: string[]
}

export interface JsrManifest extends JsrPublishConfig {
	name: string
	version: string
	exports: string | Record<string, string>
	publish?: JsrPublishConfig
}

export function jsrManifestParse(s: string): JsrManifest {
	const parsed = JSON.parse(s)

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("JSR manifest must be a JSON object")
	}

	// Basic runtime validation for required fields
	const { name, version, exports, include, exclude, publish } = parsed as JsrManifest

	if (typeof name !== "string") throw new Error("Missing or invalid 'name' in manifest")
	if (typeof version !== "string") throw new Error("Missing or invalid 'version' in manifest")
	if (typeof exports !== "string" && (typeof exports !== "object" || exports === null)) {
		throw new Error("Missing or invalid 'exports' in manifest")
	}

	// Validation for include / exclude
	if ("include" in parsed && !isArrayOfStrings(include)) {
		throw new Error("'include' field must be an array of strings")
	}
	if ("exclude" in parsed && !isArrayOfStrings(exclude)) {
		throw new Error("'exclude' field must be an array of strings")
	}

	// Validation for publish block
	if ("publish" in parsed) {
		if (!publish || typeof publish !== "object" || Array.isArray(publish)) {
			throw new Error("'publish' field must be an object")
		}
		if ("include" in publish && !isArrayOfStrings(publish.include)) {
			throw new Error("'publish.include' field must be an array of strings")
		}
		if ("exclude" in publish && !isArrayOfStrings(publish.exclude)) {
			throw new Error("'publish.exclude' field must be an array of strings")
		}
	}

	return parsed as JsrManifest
}
