import { type } from "arktype"

const baseManifest = type({
	"main?": "string",
	"module?": "string",
	"browser?": "string",
	"files?": "string[]",
	"bin?": "string | Record<string, string>",
	"optionalDependencies?": "Record<string, string>",
	"devDependencies?": "Record<string, string>",
	"dependencies?": "Record<string, string>",
})

const withBundle = baseManifest.and({
	"bundleDependencies?": "string[]",
	"bundledDependencies?": "never",
})

const withBundled = baseManifest.and({
	"bundledDependencies?": "string[]",
	"bundleDependencies?": "never",
})

export const npmManifest = withBundle.or(withBundled)

export const npmManifestParse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(npmManifest)
