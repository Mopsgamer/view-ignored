import type { CustomRule } from "../patterns/rule.js"
import type { Source } from "../patterns/source.js"

import { extractNpmignore } from "../patterns/npmignore.js"
import { isWhitespace, trimLeadingDotSlash } from "../unixify.js"

export function extractNoCaseNpmignore(source: Source, content: Uint8Array): void | null | Error {
	return extractNpmignore(source, content, { nocase: true })
}

export const symlinkRule = {
	excludes: true,
	match({ dirent }) {
		return dirent.isSymbolicLink() ? "//symlink" : null
	},
} satisfies CustomRule as CustomRule

export function makeDirectPathsRule(directPathsInclude: Record<string, string>): CustomRule {
	return {
		excludes: false,
		match({ entry }) {
			for (const [manifestProp, path] of Object.entries(directPathsInclude)) {
				if (entry === path) {
					return "//'" + manifestProp + "' property is " + path
				}
			}
			return null
		},
	} satisfies CustomRule as CustomRule
}

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
	bundleDependencies?: boolean | string[]
	bundledDependencies?: boolean | string[]
	patchedDependencies?: Record<string, string>
	workspaces?: string[] | { packages?: string[] }
}

function hasUppercase(s: string): boolean {
	const len = s.length
	for (let i = 0; i < len; i++) {
		const c = s.charCodeAt(i)
		if (c >= 65 && c <= 90) return true
	}
	return false
}

function isValidNpmName(name: string): boolean {
	const len = name.length
	if (
		len === 0 ||
		len > 214 ||
		isWhitespace(name.charCodeAt(0)) ||
		isWhitespace(name.charCodeAt(len - 1))
	) {
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
	if (part.startsWith(".") || part.startsWith("_") || hasUppercase(part)) {
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

export function isArrayOfStrings(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === "string")
}

const SEMVER_REGEX =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export function npmManifestParse(
	s: string,
	mode: "list" | "publish" | "bundle" = "publish",
): PackageJson {
	// oxlint-disable-next-line typescript/no-explicit-any
	let parsed: any
	try {
		parsed = JSON.parse(s)
	} catch (err) {
		if (mode !== "publish") return {} as PackageJson
		throw err
	}

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("npm manifest must be a JSON object")
	}

	if ("private" in parsed && typeof parsed.private !== "boolean") {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("'private' field must be a boolean")
	}

	if (!parsed.private) {
		if (typeof parsed.name !== "string") {
			if (mode !== "publish") return {} as PackageJson
			throw new Error("Manifest must have a non-empty string 'name'")
		}
		if (typeof parsed.version !== "string") {
			if (mode !== "publish") return {} as PackageJson
			throw new Error("Manifest must have a non-empty string 'version'")
		}
		if (!isValidNpmName(parsed.name)) {
			if (mode !== "publish") return {} as PackageJson
			throw new Error(`'${parsed.name}' is not a valid npm package name`)
		}

		// Strict SemVer verification
		if (!SEMVER_REGEX.test(parsed.version)) {
			if (mode !== "publish") return {} as PackageJson
			throw new Error(`'${parsed.version}' is not a valid SemVer version (expected format: X.Y.Z)`)
		}
	}

	if ("bundleDependencies" in parsed && "bundledDependencies" in parsed) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("Manifest cannot contain both 'bundleDependencies' and 'bundledDependencies'")
	}

	const stringFields: (keyof PackageJson)[] = ["browser", "main", "module"]
	for (const field of stringFields) {
		if (field in parsed && typeof parsed[field] !== "string") {
			if (mode !== "publish") return {} as PackageJson
			throw new Error(`'${field}' field must be a string`)
		}
	}

	if (parsed.engines !== undefined && !isRecordOfStrings(parsed.engines)) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("'engines' field must be an object with string values")
	}
	if (parsed.scripts !== undefined && !isRecordOfStrings(parsed.scripts)) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("'scripts' field must be an object with string values")
	}
	if (parsed.dependencies !== undefined && !isRecordOfStrings(parsed.dependencies)) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("'dependencies' field must be an object with string values")
	}
	if (parsed.devDependencies !== undefined && !isRecordOfStrings(parsed.devDependencies)) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("'devDependencies' field must be an object with string values")
	}
	if (
		parsed.optionalDependencies !== undefined &&
		!isRecordOfStrings(parsed.optionalDependencies)
	) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("'optionalDependencies' field must be an object with string values")
	}

	if ("files" in parsed && !isArrayOfStrings(parsed.files)) {
		if (mode !== "publish") return {} as PackageJson
		throw new Error("'files' field must be an array of strings")
	}

	const bundleFields: (keyof PackageJson)[] = ["bundleDependencies", "bundledDependencies"]
	for (const field of bundleFields) {
		if (field in parsed && typeof parsed[field] !== "boolean" && !isArrayOfStrings(parsed[field])) {
			if (mode !== "publish") return {} as PackageJson
			throw new Error(`'${field}' field must be a boolean or an array of strings`)
		}
	}

	if ("bin" in parsed) {
		const binValue = parsed.bin
		const isValidBin = typeof binValue === "string" || isRecordOfStrings(binValue)
		if (!isValidBin) {
			if (mode !== "publish") return {} as PackageJson
			throw new Error("'bin' field must be a string or an object with string values")
		}
	}

	return parsed as PackageJson
}

/**
 * Extracts and normalizes direct paths (main, module, browser, and bin fields)
 * to be included in target package file scans, cleaning leading `./` and `/`,
 * stripping trailing slashes, and ignoring invalid parent-escaping paths (e.g., `../`).
 *
 * @since 0.12.0
 */
export function extractManifestIncludes(manifest: PackageJson, dist: Record<string, string>): void {
	addDirectPath(manifest.main, dist, "main")
	addDirectPath(manifest.module, dist, "module")
	addDirectPath(manifest.browser, dist, "browser")

	if (typeof manifest.bin === "string") {
		addDirectPath(manifest.bin, dist, "bin")
	} else if (typeof manifest.bin === "object" && manifest.bin !== null) {
		Object.entries(manifest.bin).forEach(([key, binPath]) => {
			addDirectPath(binPath, dist, "bin." + key)
		})
	}
}

function addDirectPath(p: string | undefined, dist: Record<string, string>, key: string) {
	if (typeof p !== "string") return
	const normalized = trimLeadingDotSlash(p)
	if (normalized && !normalized.startsWith("../") && normalized !== "..") {
		dist[key] = normalized
	}
}
