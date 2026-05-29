import type { PackageJson } from "./npmManifest.js"

import { npmManifestParse } from "./npmManifest.js"

export interface VsceManifest extends PackageJson {
	engines: {
		vscode: string
	}
}

function isDigitOrX(c: number): boolean {
	return (c >= 48 && c <= 57) || c === 120 || c === 88 // 0-9, x, X
}

function validatePart(s: string): boolean {
	if (s.length === 0) return false
	for (let i = 0; i < s.length; i++) {
		if (!isDigitOrX(s.charCodeAt(i))) return false
	}
	return true
}

export function vsceManifestParse(s: string): VsceManifest {
	const parsed = npmManifestParse(s)

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("VSCE manifest must be a JSON object")
	}

	if (
		!parsed.engines ||
		typeof parsed.engines !== "object" ||
		typeof parsed.engines.vscode !== "string"
	) {
		throw new Error("VSCE manifest must include an 'engines.vscode' string")
	}

	let v = parsed.engines.vscode
	let valid = false
	if (v === "*") {
		valid = true
	} else {
		if (v.startsWith("^")) v = v.slice(1)
		else if (v.startsWith(">=")) v = v.slice(2)
		const dashIndex = v.indexOf("-")
		if (dashIndex !== -1) v = v.slice(0, dashIndex)
		const parts = v.split(".")
		if (parts.length === 3) {
			if (validatePart(parts[0]!) && validatePart(parts[1]!) && validatePart(parts[2]!)) {
				valid = true
			}
		}
	}

	if (!valid) {
		throw new Error(`Invalid 'engines.vscode' version format: "${parsed.engines.vscode}"`)
	}

	return parsed as VsceManifest
}
