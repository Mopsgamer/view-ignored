import { npmManifestParse, type PackageJson } from "./npmManifest.js"

export interface VsceManifest extends PackageJson {
	engines: {
		vscode: string
	}
}

// Regex source for validating the vscode engine compatibility version format.
// https://github.com/microsoft/vscode-vsce/blob/70ca6ac250dfe5ca19214a3ad357368ffae471c5/src/validation.ts#L52
const VSCODE_ENGINE_REGEX = /^\*$|^(\^|>=)?((\d+)|x)\.((\d+)|x)\.((\d+)|x)(-.*)?$/

export function vsceManifestParse(s: string): VsceManifest {
	const parsed = npmManifestParse(s, "vsce")

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

	if (!VSCODE_ENGINE_REGEX.test(parsed.engines.vscode)) {
		throw new Error(`Invalid 'engines.vscode' version format: "${parsed.engines.vscode}"`)
	}

	return parsed as VsceManifest
}
