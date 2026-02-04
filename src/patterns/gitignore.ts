import type { ExtractorFn } from "./extractor.js"
import type { PatternMinimatch, Pattern } from "./pattern.js"
import { makeRe } from "minimatch"
import { sourcePushNegatable, type Source } from "./source.js"

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
	// TODO: validate gitignore
}

extractGitignore satisfies ExtractorFn

export function gitignoreCompile(
	pattern: string,
	_: number = -1,
	array: Pattern = [],
): PatternMinimatch {
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
	;(r as PatternMinimatch).pattern = pattern
	;(r as PatternMinimatch).patternContext = array

	return r as PatternMinimatch
}
