import { type } from "arktype"

import type { Target } from "./target.js"

import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractPackageJsonNocase,
	extractGitignoreNocase,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { npmManifestParse } from "./npmManifest.js"

const extractors: Extractor[] = [
	{
		extract: extractPackageJsonNocase,
		path: "package.json",
	},
	{
		extract: extractGitignoreNocase,
		path: ".yarnignore",
	},
	{
		extract: extractGitignoreNocase,
		path: ".npmignore",
	},
	{
		extract: extractGitignoreNocase,
		path: ".gitignore",
	},
]

const internal: SignedPattern[] = [
	signedPatternCompile(
		{
			excludes: true,
			pattern: [
				// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L26
				".git",
				"CVS",
				".svn",
				".hg",

				"node_modules",

				"yarn.lock",
				".lock-wscript",
				".wafpickle-0",
				".wafpickle-1",
				".wafpickle-2",
				".wafpickle-3",
				".wafpickle-4",
				".wafpickle-5",
				".wafpickle-6",
				".wafpickle-7",
				".wafpickle-8",
				".wafpickle-9",
				"*.swp",
				"._*",
				"npm-debug.log",
				"yarn-error.log",
				".npmrc",
				".yarnrc",
				".yarnrc.yml",
				".npmignore",
				".gitignore",
				".DS_Store",
			],
			compiled: null,
		},
		{ nocase: true },
	),
	signedPatternCompile(
		{
			excludes: false,
			pattern: [
				// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
				"/package.json",
				"/readme*",
				"/license*",
				"/licence*",
				"/changes*",
				"/changelog*",
				"/history*",
			],
			compiled: null,
		},
		{ nocase: true },
	),
]

/**
 * @since 0.8.0
 */
export const YarnClassic: Target = {
	async init({ fs, cwd }) {
		let content: Buffer
		const normalCwd = unixify(cwd)
		try {
			content = await fs.promises.readFile(normalCwd + "/" + "package.json")
		} catch (error) {
			throw new Error("Error while initializing Yarn classic", { cause: error })
		}

		const dist = npmManifestParse(content.toString())
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
			target: YarnClassic,
		})
	},
}
