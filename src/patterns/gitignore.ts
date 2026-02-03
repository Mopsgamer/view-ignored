import type { ExtractorFn } from "./extractor.js"
import type { PatternMinimatch } from "./pattern.js"
import { makeRe } from "minimatch"
import { sourcePushNegatable, type Source } from "./source.js"

export function extractGitignore(source: Source, content: Buffer<ArrayBuffer>): void {
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
	// TODO: validate gitignore
}

extractGitignore satisfies ExtractorFn

export function gitignoreCompile(pattern: string): PatternMinimatch {
	if (pattern.endsWith("/")) {
		pattern = pattern.substring(0, pattern.length - 1)
	}
	if (pattern.startsWith("/")) {
		pattern = pattern.substring(1)
	} else if (!pattern.startsWith("**/")) {
		pattern = "**/" + pattern
	}

	pattern += "/**"

	const r = makeRe(pattern, { dot: true, nonegate: true, nocomment: true, nobrace: true }) as RegExp
	;(r as PatternMinimatch).context = pattern

	return r as PatternMinimatch
}
