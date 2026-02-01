import type { ExtractorFn } from "./matcher.js"
import { minimatch, type MinimatchOptions } from "minimatch"
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

export function gitignoreMatch(pattern: string, path: string): boolean {
	const o: MinimatchOptions = { dot: true }
	if (pattern.endsWith("/")) {
		pattern = pattern.substring(0, pattern.length - 1)
	}
	if (pattern.startsWith("/")) {
		pattern = pattern.substring(1)
	} else if (!pattern.startsWith("**/")) {
		pattern = "**/" + pattern
	}
	return minimatch(path, pattern, o) || minimatch(path, pattern + "/**", o)
}
