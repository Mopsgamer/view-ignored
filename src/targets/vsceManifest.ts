import type { PackageJson } from "./npmManifest.js"

import { npmManifestParse } from "./npmManifest.js"

/**
 * Represents the structure of a VSCode extension manifest.
 */
export interface VsceManifest extends PackageJson {
	/**
	 * Extension engine compatibility.
	 */
	engines: {
		/**
		 * VSCode version range.
		 */
		vscode: string
	}
}

/**
 * Parses a VSCE manifest (package.json) string into a {@link VsceManifest} object.
 *
 * @since 0.12.0
 * @throws Error if parsing fails or extension-specific fields are missing or invalid.
 */
export function vsceManifestParse(s: string): VsceManifest {
	const parsed = npmManifestParse(s)

	if (
		!parsed.engines ||
		typeof parsed.engines !== "object" ||
		typeof parsed.engines.vscode !== "string"
	) {
		throw new Error("VSCE manifest must include an 'engines.vscode' string")
	}

	validateVscodeEngine(parsed.engines.vscode)

	return parsed as VsceManifest
}

/**
 * Validates the 'engines.vscode' field using manual parsing instead of regex.
 */
function validateVscodeEngine(v: string): void {
	if (v === "*") return

	let version = v
	if (version.startsWith("^")) version = version.slice(1)
	else if (version.startsWith(">=")) version = version.slice(2)

	const dashIndex = version.indexOf("-")
	if (dashIndex !== -1) version = version.slice(0, dashIndex)

	const parts = version.split(".")
	if (parts.length === 3 && parts.every(validatePart)) return

	throw new Error(`Invalid 'engines.vscode' version format: "${v}"`)
}

/**
 * Checks if a version part consists of digits or 'x'.
 */
function validatePart(s: string): boolean {
	if (s.length === 0) return false
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i)
		// 0-9, x, X
		if (!((c >= 48 && c <= 57) || c === 120 || c === 88)) return false
	}
	return true
}
