import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import type { Target } from "./target.js"

const sources = [".gitignore"]

const extractors = new Map<string, SourceExtractor>([
	[".gitignore", extractGitignore],
	// formatter keep
])

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
}

export const Git: Target = {
	ignores(cwd, entry, ctx) {
		return signedPatternIgnores(internal, {
			ctx,
			cwd,
			entry,
			sources,
			extractors,
		})
	},
}
