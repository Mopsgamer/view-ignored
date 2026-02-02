import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"
import { signedPatternIgnores, type SignedPattern } from "../patterns/signedPattern.js"
import { extractGitignore } from "../patterns/gitignore.js"

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
