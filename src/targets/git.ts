import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import type { Target } from "./target.js"

export const Git: Target = {
	ignores(cwd, entry, ctx) {
		const gitSources = [".gitignore"]
		const gitSourceMap = new Map<string, SourceExtractor>([[".gitignore", extractGitignore]])
		const gitPattern: SignedPattern = {
			exclude: [".git", ".DS_Store"],
			include: [],
		}
		return signedPatternIgnores(gitPattern, cwd, entry, gitSources, gitSourceMap, ctx)
	},
}
