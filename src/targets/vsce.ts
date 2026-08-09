import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractGitignore,
	packageJsonExtractor,
	type GlobRule,
} from "../patterns/index.js"
import { vsceManifestParse } from "./vsceManifest.js"

let cachedVSCERule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeVSCE(): Target {
	const extractors: Extractor[] = [
		packageJsonExtractor,
		{
			extract: extractGitignore,
			path: ".vscodeignore",
		},
		{
			extract: extractGitignore,
			path: ".gitignore",
		},
	]

	cachedVSCERule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [
			// The list of default ignored files and glob patterns used by VSCE when packaging extensions.
			// https://github.com/microsoft/vscode-vsce/blob/70ca6ac250dfe5ca19214a3ad357368ffae471c5/src/package.ts#L1633
			".vscodeignore",
			"package-lock.json",
			"npm-debug.log",
			"yarn.lock",
			"yarn-error.log",
			"npm-shrinkwrap.json",
			".editorconfig",
			".npmrc",
			".yarnrc",
			".gitattributes",
			"*.todo",
			"tslint.yaml",
			".eslintrc*",
			".babelrc*",
			".prettierrc*",
			".cz-config.js",
			".commitlintrc*",
			"webpack.config.js",
			"ISSUE_TEMPLATE.md",
			"CONTRIBUTING.md",
			"PULL_REQUEST_TEMPLATE.md",
			"CODE_OF_CONDUCT.md",
			".github",
			".travis.yml",
			"appveyor.yml",
			".git",
			"*.vsix",
			".DS_Store",
			"*.vsixmanifest",
			".vscode-test",
			".vscode-test-web",
		],
	})

	const internal: Rule[] = [cachedVSCERule]

	return {
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			fs.readFile(cwd + "/package.json", (err, content) => {
				if (err) {
					cb(new Error("Error while initializing VSCE", { cause: err }))
					return
				}

				try {
					vsceManifestParse(content!.toString())
				} catch (error) {
					cb(new Error("Invalid 'package.json'", { cause: error }))
					return
				}
				cb(null)
			})
		},
		internalRules: internal,
		root: ".",
	}
}
