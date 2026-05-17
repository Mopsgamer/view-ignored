export interface PackageJson {
	name: string
	version: string
	private?: boolean
	engines?: Record<string, string>
	scripts?: Record<string, string>
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

function isValidNpmName(name: string): boolean {
	if (name.trim() !== name || name.length === 0 || name.length > 214) {
		return false
	}
	if (name.startsWith("@")) {
		const parts = name.slice(1).split("/")
		if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
			return false
		}
		return isValidNameComponent(parts[0]!) && isValidNameComponent(parts[1]!)
	}
	return isValidNameComponent(name)
}

function isValidNameComponent(part: string): boolean {
	if (part.startsWith(".") || part.startsWith("_") || part !== part.toLowerCase()) {
		return false
	}
	if (/[~!'()* ]/.test(part)) {
		return false
	}
	try {
		return encodeURIComponent(part) === part
	} catch {
		return false
	}
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false
	}
	return Object.values(value).every((v) => typeof v === "string")
}

function isArrayOfStrings(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === "string")
}

const SEMVER_REGEX =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export function npmManifestParse(s: string): PackageJson {
	const parsed = JSON.parse(s)

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("npm manifest must be a JSON object")
	}

	if ("private" in parsed && typeof parsed.private !== "boolean") {
		throw new Error("'private' field must be a boolean")
	}

	if (!parsed.private) {
		if (typeof parsed.name !== "string") {
			throw new Error("Manifest must have a non-empty string 'name'")
		}
		if (typeof parsed.version !== "string") {
			throw new Error("Manifest must have a non-empty string 'version'")
		}
		if (!isValidNpmName(parsed.name)) {
			throw new Error(`'${parsed.name}' is not a valid npm package name`)
		}

		// Strict SemVer verification
		if (!SEMVER_REGEX.test(parsed.version)) {
			throw new Error(`'${parsed.version}' is not a valid SemVer version (expected format: X.Y.Z)`)
		}
	}

	if ("bundleDependencies" in parsed && "bundledDependencies" in parsed) {
		throw new Error("Manifest cannot contain both 'bundleDependencies' and 'bundledDependencies'")
	}

	const stringFields: (keyof PackageJson)[] = ["browser", "main", "module"]
	for (const field of stringFields) {
		if (field in parsed && typeof parsed[field] !== "string") {
			throw new Error(`'${field}' field must be a string`)
		}
	}

	const recordFields: (keyof PackageJson)[] = [
		"engines",
		"scripts",
		"dependencies",
		"devDependencies",
		"optionalDependencies",
	]
	for (const field of recordFields) {
		if (field in parsed && !isRecordOfStrings(parsed[field])) {
			throw new Error(`'${field}' field must be an object with string values`)
		}
	}

	const arrayFields: (keyof PackageJson)[] = ["files", "bundleDependencies", "bundledDependencies"]
	for (const field of arrayFields) {
		if (field in parsed && !isArrayOfStrings(parsed[field])) {
			throw new Error(`'${field}' field must be an array of strings`)
		}
	}

	if ("bin" in parsed) {
		const binValue = parsed.bin
		const isValidBin = typeof binValue === "string" || isRecordOfStrings(binValue)
		if (!isValidBin) {
			throw new Error("'bin' field must be a string or an object with string values")
		}
	}

	return parsed as PackageJson
}
