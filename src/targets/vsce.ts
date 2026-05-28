import type { Extractor, Rule } from "../patterns/index.js"
import type { Target } from "./target.js"

import {
	makeGitignoreExtractor,
	makePackageJsonExtractor,
	ruleCompile,
	ruleTest,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { vsceManifestParse } from "./vsceManifest.js"

const extractors: Extractor[] = [
	makePackageJsonExtractor("package.json"),
	makeGitignoreExtractor(".vscodeignore"),
	makeGitignoreExtractor(".gitignore"),
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
	init({ fs, cwd }, cb) {
		const normalCwd = unixify(cwd)
		fs.readFile(normalCwd + "/package.json", (err, content) => {
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
			cb()
		})
	},
	internalRules: internal,
	root: ".",
}
