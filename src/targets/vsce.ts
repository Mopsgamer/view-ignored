import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractPackageJson,
	extractGitignore,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { vsceManifestParse } from "./vsceManifest.js"

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

const internal: Rule[] = [
	ruleCompile({
		compiled: null,
		excludes: true,
		pattern: [
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
	}),
]

/**
 * @since 0.6.0
 */
export const VSCE: Target = <Target>{
	extractors,
	ignores: ruleTest,
	async init({ fs, cwd }) {
		let content: Buffer
		const normalCwd = unixify(cwd)
		try {
			content = await fs.promises.readFile(normalCwd + "/" + "package.json")
		} catch (error) {
			throw new Error("Error while initializing VSCE", { cause: error })
		}

		try {
			vsceManifestParse(content.toString())
		} catch (error) {
			throw new Error("Invalid 'package.json'", { cause: error })
		}
	},
	internalRules: internal,
	isIgnoreFile: (path) => extractors.some((e) => e.path === path),
	root: ".",
}
