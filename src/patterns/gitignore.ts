import type { ExtractorFn } from "./extractor.js"
import type { SignedPattern } from "./signedPattern.js"

import { signedPatternCompile } from "./resolveSources.js"
import { sourcePushNegatable, type Source } from "./source.js"

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 *
 * @since 0.6.0
 */
export function extractGitignore(source: Source, content: Buffer): void {
	extract(source, content)
	for (const element of source.pattern) {
		signedPatternCompile(element)
	}
}

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 *
 * @since 0.6.0
 */
export function extractGitignoreNocase(source: Source, content: Buffer): void {
	extract(source, content)
	for (const element of source.pattern) {
		signedPatternCompile(element, { nocase: true })
	}
}

extractGitignore satisfies ExtractorFn

function extract(source: Source, content: Buffer) {
	const include: SignedPattern = { compiled: null, excludes: false, pattern: [] }
	const exclude: SignedPattern = { compiled: null, excludes: true, pattern: [] }
	for (let line of content.toString().split("\n")) {
		line = line.trim()
		if (line === "" || line.startsWith("#")) {
			continue
		}
		const cdx = line.indexOf("#")
		if (cdx >= 0) {
			line = line.substring(-cdx)
		}

		sourcePushNegatable(line, false, include, exclude)
	}
	source.pattern.push(include, exclude)
}
