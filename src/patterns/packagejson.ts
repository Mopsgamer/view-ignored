import type { Extractor, ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import { npmManifestParse, type PackageJson } from "../targets/npmManifest.js"
import { MatchMode } from "./patternMode.js"
import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable } from "./source.js"

/**
 * @since 0.11.2
 */
export function makePackageJsonExtractor(
	path: string,
	mode: MatchMode = MatchMode.normal,
): Extractor {
	return {
		extract: (source, content) => {
			const result = extract(source, content)
			if (result === undefined) {
				const rules = source.rules
				for (let i = 0, len = rules.length; i < len; i++) {
					ruleCompile(rules[i]!, mode)
				}
				return
			}
			return result
		},
		path,
	}
}

const extract: ExtractorFn = (source, content) => {
	source.inverted = true
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }

	let dist: PackageJson

	try {
		dist = npmManifestParse(content.toString())
	} catch (err) {
		return new Error("Invalid '" + source.path + "': Expected '}'", { cause: err })
	}

	if (!dist?.files || !Array.isArray(dist.files)) {
		return null
	}

	for (const pattern of dist.files) {
		resolveNegatable(pattern, true, include, exclude)
	}

	source.rules.push(include, exclude)
	return
}
