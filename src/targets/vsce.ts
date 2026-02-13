import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractPackageJson,
	extractGitignore,
} from "../patterns/index.js"

import type { Target } from "./target.js"

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
	exclude: [
		// https://github.com/microsoft/vscode-vsce/blob/main/src/package.ts#L1633
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
	include: [],
	compiled: null,
}

signedPatternCompile(internal)

/**
 * @since 0.6.0
 */
export const VSCE: Target = {
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: VSCE,
		})
	},
}
