export interface NpmManifest {
	bin?: string | Record<string, string>
	browser?: string
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	files?: string[]
	main?: string
	module?: string
	optionalDependencies?: Record<string, string>
	bundleDependencies?: string[]
	bundledDependencies?: string[]
}

export function npmManifestParse(s: string): NpmManifest {
	const parsed = JSON.parse(s)

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("npm manifest must be a JSON object")
	}

	const dist = parsed as NpmManifest

	if (dist.bundleDependencies && dist.bundledDependencies) {
		throw new Error("Manifest cannot contain both 'bundleDependencies' and 'bundledDependencies'")
	}

	if (dist.files && !Array.isArray(dist.files)) {
		throw new Error("'files' field must be an array of strings")
	}

	return dist
}
