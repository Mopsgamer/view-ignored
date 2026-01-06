import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import { extractPackageJson } from "../patterns/packagejson.js"
import type { Target } from "./target.js"

const sources = ["package.json", ".vscodeignore"]

const extractors = new Map<string, SourceExtractor>([
	["package.json", extractPackageJson],
	[".vscodeignore", extractGitignore],
	[".gitignore", extractGitignore],
])

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
}

export const VSCE: Target = {
	ignores(cwd, entry, ctx) {
		return signedPatternIgnores({
			internal,
			ctx,
			cwd,
			entry,
			sources,
			extractors,
		})
	},
}
