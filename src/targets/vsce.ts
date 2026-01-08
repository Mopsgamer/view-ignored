import { type Extractor, type SignedPattern, signedPatternIgnores } from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import { extractPackageJson } from "../patterns/packagejson.js"
import type { Target } from "./target.js"

export const VSCE: Target = {
	ignores(cwd, entry, ctx) {
		const extractors: Extractor[] = [
			{
				extract: extractPackageJson,
				path: "package.json",
			},
			{
				extract: extractGitignore,
				path: ".vscodeignore",
			},
			{
				extract: extractGitignore,
				path: ".gitignore",
			},
		]

		const internal: SignedPattern = {
			exclude: [".git", ".DS_Store"],
			include: [],
		}

		return signedPatternIgnores({
			internal,
			ctx,
			cwd,
			entry,
			extractors,
		})
	},
}
