import type { ExtractorFn } from "./extractor.js"
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
	signedPatternCompile(source.pattern)
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
	signedPatternCompile(source.pattern, { nocase: true })
}

extractGitignore satisfies ExtractorFn

function extract(source: Source, content: Buffer) {
	for (let line of content.toString().split("\n")) {
		line = line.trim()
		if (line === "" || line.startsWith("#")) {
			continue
		}
		const cdx = line.indexOf("#")
		if (cdx >= 0) {
			line = line.substring(-cdx)
		}

		sourcePushNegatable(source, line)
	}
}
