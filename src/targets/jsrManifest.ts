export interface JsrManifest {
	exports: string | Record<string, string>
	name: string
	version: string
}

export function jsrManifestParse(s: string): JsrManifest {
	const parsed = JSON.parse(s)

	if (!parsed || typeof parsed !== "object") {
		throw new Error("JSR manifest must be a JSON object")
	}

	// Basic runtime validation for required fields
	const { name, version, exports } = parsed as JsrManifest

	if (typeof name !== "string") {
		throw new Error("Missing or invalid 'name' in manifest")
	}
	if (typeof version !== "string") {
		throw new Error("Missing or invalid 'version' in manifest")
	}
	if (typeof exports !== "string" && (typeof exports !== "object" || exports === null)) {
		throw new Error("Missing or invalid 'exports' in manifest")
	}

	return parsed as JsrManifest
}
