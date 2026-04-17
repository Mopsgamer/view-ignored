import { type } from "arktype"

const baseManifest = type({
	"bin?": "string | Record<string, string>",
	"browser?": "string",
	"dependencies?": "Record<string, string>",
	"devDependencies?": "Record<string, string>",
	"files?": "string[]",
	"main?": "string",
	"module?": "string",
	"optionalDependencies?": "Record<string, string>",
})

const withBundle = baseManifest.and({
	"bundleDependencies?": "string[]",
	"bundledDependencies?": "never",
})

const withBundled = baseManifest.and({
	"bundleDependencies?": "never",
	"bundledDependencies?": "string[]",
})

export const npmManifest = withBundle.or(withBundled)

export const npmManifestParse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(npmManifest)
