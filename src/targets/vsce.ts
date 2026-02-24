import { type } from "arktype"

import type { Target } from "./target.js"

import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractPackageJson,
	extractGitignore,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { npmManifest } from "./npmManifest.js"

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

const internal: SignedPattern[] = [
	signedPatternCompile({
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
		compiled: null,
	}),
]

const vsceManifest = npmManifest.and({
	engines: {
		// https://github.com/microsoft/vscode-vsce/blob/main/src/validation.ts#L52
		vscode: "/^\\*$|^(\\^|>=)?((\\d+)|x)\\.((\\d+)|x)\\.((\\d+)|x)(\\-.*)?$/",
	},
})

const vsceManifestParse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(vsceManifest)

/**
 * @since 0.6.0
 */
export const VSCE: Target = {
	async init({ fs, cwd }) {
		let content: Buffer
		const normalCwd = unixify(cwd)
		try {
			content = await fs.promises.readFile(normalCwd + "/" + "package.json")
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return // no package.json
			}
			throw new Error("Error while initializing VSCE", { cause: error })
		}

		const dist = vsceManifestParse(content.toString())
		if (dist instanceof type.errors) {
			throw new Error("Invalid 'package.json': " + dist.summary, { cause: dist })
		}
	},
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
