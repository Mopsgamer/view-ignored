/**
 * Represents the structure of a package.json file relevant for scanning.
 */
export interface PackageJson {
	/**
	 * Package name.
	 */
	name: string
	/**
	 * Package version.
	 */
	version: string
	/**
	 * List of files to include in the package.
	 */
	files?: string[]
	/**
	 * Main entry point.
	 */
	main?: string
	/**
	 * ES module entry point.
	 */
	module?: string
	/**
	 * Browser entry point.
	 */
	browser?: string
	/**
	 * Executable binary paths.
	 */
	bin?: string | Record<string, string>
	[key: string]: any
}

/**
 * Parses an NPM manifest (package.json) string into a {@link PackageJson} object.
 *
 * @since 0.12.0
 * @throws Error if parsing fails or required fields are missing.
 */
export function npmManifestParse(text: string): PackageJson {
	const parsed = JSON.parse(text)

	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error("Invalid package.json: must be an object")
	}

	validateRequiredString(parsed.name, "name")
	validateRequiredString(parsed.version, "version")

	return parsed as PackageJson
}

/**
 * Ensures a required field is a non-empty string.
 */
function validateRequiredString(val: any, fieldName: string): void {
	if (typeof val !== "string" || val.length === 0) {
		throw new Error(`Invalid package.json: '${fieldName}' must be a non-empty string`)
	}
}
