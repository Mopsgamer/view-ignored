export interface PackageJson {
	name: string
	version: string
	files?: string[]
	main?: string
	module?: string
	browser?: string
	bin?: string | Record<string, string>
	[key: string]: any
}

/**
 * Parses an NPM manifest (package.json).
 *
 * @since 0.11.2
 */
export function npmManifestParse(text: string): PackageJson {
	const parsed = JSON.parse(text)
	if (typeof parsed !== "object" || parsed === null) throw new Error("Invalid package.json")
	if (typeof parsed.name !== "string") throw new Error("Invalid package.json name")
	if (typeof parsed.version !== "string") throw new Error("Invalid package.json version")
	return parsed
}
