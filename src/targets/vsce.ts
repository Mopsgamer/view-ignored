import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import { extractPackageJson } from "../patterns/packagejson.js"
import type { Target } from "./target.js"

export const VSCE: Target = {
	ignores(cwd, entry, ctx) {
		const vsceSources = ["package.json", ".vscodeignore"]
		const vsceSourceMap = new Map<string, SourceExtractor>([
			["package.json", extractPackageJson],
			[".vscodeignore", extractGitignore],
			[".gitignore", extractGitignore],
		])
		const vscePattern: SignedPattern = {
			exclude: [".git", ".DS_Store"],
			include: [],
		}
		return signedPatternIgnores(vscePattern, cwd, entry, vsceSources, vsceSourceMap, ctx)
	},
}
