import type { Target } from "./target.js"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type InternalRules,
	type Source,
} from "../patterns/index.js"

/**
 * @since 0.11.2
 */
export function makeGit(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractGitignore,
			path: ".gitignore",
		},
	]

	const internal: InternalRules = {
		after: [],
		before: [
			ruleCompile({
				compiled: null,
				excludes: true,
				pattern: [".git", ".DS_Store"],
			}),
		],
	}

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			const excludePath =
				cwd + (cwd.charCodeAt(cwd.length - 1) === 47 ? "" : "/") + ".git/info/exclude"
			fs.readFile(excludePath, (err, content) => {
				if (err) {
					if (err.code === "ENOENT") {
						cb(null)
						return
					}
					cb(err)
					return
				}

				const source = <Source>{
					inverted: false,
					path: ".git/info/exclude",
					rules: [],
				}
				const errex = extractGitignore(source, content)
				if (errex) {
					cb(errex)
					return
				}
				internal.after.push(...source.rules)
				cb(null)
			})
		},
		internalRules: internal,
		needsSource: false,
		root: "/",
	}
}
