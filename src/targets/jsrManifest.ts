import { type } from "arktype"

export const jsrManifest = type({
	name: "string",
	version: "string",
	exports: "string | Record<string, string>",
})

export const jsrManifestParse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(jsrManifest)
