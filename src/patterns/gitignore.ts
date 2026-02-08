import type { ExtractorFn } from "./extractor.js"
import { signedPatternCompile } from "./resolveSources.js"
import { sourcePushNegatable, type Source } from "./source.js"

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 */
export function extractGitignore(source: Source, content: Buffer): void {
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
	signedPatternCompile(source.pattern)
	// TODO: validate gitignore
}

extractGitignore satisfies ExtractorFn
