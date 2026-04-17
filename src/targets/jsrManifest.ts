import { type } from "arktype"

export const jsrManifest = type({
	exports: "string | Record<string, string>",
	name: "string",
	version: "string",
})

export const jsrManifestParse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(jsrManifest)
