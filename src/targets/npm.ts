import { type } from "arktype"

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
import { npmManifestParse } from "./npmManifest.js"

const extractors: Extractor[] = [
	{
		extract: extractPackageJson,
		path: "package.json",
	},
	{
		extract: extractGitignore,
		path: ".npmignore",
	},
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
]

const internalInclude: Rule = {
	compiled: [],
	excludes: false,
	pattern: [], // filled within init
}

const internal: Rule[] = [
	internalInclude,
	ruleCompile({
		compiled: null,
		excludes: true,
		pattern: [
			// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L16
			".npmignore",
			".gitignore",
			".git",
			".svn",
			".hg",
			"CVS",
			".git",
			".svn",
			".hg",
			"CVS",
			"/.lock-wscript",
			"/.wafpickle-*",
			"/build/config.gypi",
			"npm-debug.log",
			".npmrc",
			".*.swp",
			".DS_Store",
			"._*",
			"*.orig",
			"/archived-packages/**",

			// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L294
			"/node_modules",
			"/package-lock.json",
			"/yarn.lock",
			"/pnpm-lock.yaml",
			"/bun.lockb",
		],
	}),
	ruleCompile({
		compiled: null,
		excludes: false,
		pattern: [
			// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L287
			"bin",
			"package.json",
			"README",
			"COPYING",
			"LICENSE",
			"LICENCE",
			"README.*",
			"COPYING.*",
			"LICENSE.*",
			"LICENCE.*",
		],
	}),
]

/**
 * @since 0.6.0
 */
export const NPM: Target = {
	extractors,
	ignores: ruleTest,
	async init({ fs, cwd }) {
		let content: Buffer
		const normalCwd = unixify(cwd)
		try {
			content = await fs.promises.readFile(normalCwd + "/" + "package.json")
		} catch (error) {
			throw new Error("Error while initializing NPM", { cause: error })
		}

		const dist = npmManifestParse(content.toString())
		if (dist instanceof type.errors) {
			throw new Error("Invalid 'package.json': " + dist.summary, { cause: dist })
		}

		// const set = new Set<string>()

		// TODO: NPM should include bundled deps

		// internalInclude.pattern = Array.from(set)
		// ruleCompile(internalInclude, { nocase: true })
	},
	internalRules: internal,
	root: ".",
}
