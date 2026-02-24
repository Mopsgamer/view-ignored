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

const internalInclude: SignedPattern = {
	excludes: false,
	pattern: [], // filled within init
	compiled: [],
}

const internal: SignedPattern[] = [
	internalInclude,
	signedPatternCompile({
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
		compiled: null,
	}),
	signedPatternCompile({
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
		compiled: null,
	}),
]

/**
 * @since 0.6.0
 */
export const NPM: Target = {
	async init({ fs, cwd }) {
		let content: Buffer
		const normalCwd = unixify(cwd)
		try {
			content = await fs.promises.readFile(normalCwd + "/" + "package.json")
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return // no package.json
			}
			throw new Error("Error while initializing Bun's ignoring implementation", { cause: error })
		}

		const dist = npmManifestParse(content.toString())
		if (dist instanceof type.errors) {
			throw new Error("Invalid 'package.json': " + dist.summary, { cause: dist })
		}

		// const set = new Set<string>()

		// TODO: NPM should include bundled deps

		// internalInclude.pattern = Array.from(set)
		// signedPatternCompile(internalInclude, { nocase: true })
	},
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: NPM,
		})
	},
}
