import { type Extractor, type SignedPattern, signedPatternIgnores } from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import type { Target } from "./target.js"

export const Git: Target = {
	ignores(fs, cwd, entry, ctx) {
		const extractors: Extractor[] = [
			{
				extract: extractGitignore,
				path: ".gitignore",
			},
			{
				extract: extractGitignore,
				path: ".git/info/exclude",
			},
		]

		const internal: SignedPattern = {
			exclude: [".git", ".DS_Store"],
			include: [],
		}

		return signedPatternIgnores({
			fs,
			internal,
			ctx,
			cwd,
			entry,
			extractors,
		})
	},
}
