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
import { join, unixify } from "../unixify.js"
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
			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L180
			"package-lock.json",
			"yarn.lock",
			"pnpm-lock.yaml",
			"bun.lockb",
			"bun.lock", // npm includes it

			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L189
			".*.swp",
			"._*",
			".DS_Store",
			".git",
			".gitignore",
			".hg",
			".npmignore",
			".npmrc",
			".lock-wscript",
			".svn",
			"wafpickle-*",
			"CVS",
			"npm-debug.log",

			// bun says it is "mentioned in the docs but does not appear to be ignored by default"
			// but we know it should be /build/config.gypi, not just config.gypi, haha
			// "config.gypi",

			".env.production", // npm includes it
			"bunfig.toml", // npm includes it

			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L284
			// manifest should be included, but bun ignores it on this line
			// bun forces it later: https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L2586
			// "package.json",

			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L285
			"node_modules",
		],
	}), // nocase should be false here
	ruleCompile(
		{
			compiled: null,
			excludes: true,
			pattern: [
				// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L2586
				"package.json",

				// the special?.* check works this way: https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L2599
				"LICENSE",
				"LICENSE.*",
				"LICENCE",
				"LICENCE.*",
				"README",
				"README.*",
			],
		},
		{ nocase: true },
	),
]

/**
 * @since 0.8.1
 */
export const Bun: Target = {
	extractors,
	ignores: ruleTest,
	async init({ fs, cwd }) {
		let content: Buffer
		const normalCwd = unixify(cwd)
		try {
			content = await fs.promises.readFile(normalCwd + "/" + "package.json")
		} catch (error) {
			throw new Error("Error while initializing Bun", { cause: error })
		}

		const dist = npmManifestParse(content.toString())
		if (dist instanceof type.errors) {
			throw new Error("Invalid 'package.json': " + dist.summary, { cause: dist })
		}

		const set = new Set<string>()

		function normal(path: string): string {
			const result = unixify(join(normalCwd, path)).substring(normalCwd.length)
			return result
		}

		// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L1440
		if (typeof dist.bin === "string") {
			set.add(normal(dist.bin))
		} else if (typeof dist.bin === "object" && dist.bin !== null) {
			Object.values(dist.bin).forEach((binPath) => set.add(normal(binPath)))
		}

		// TODO: Bun should include bundled deps
		// nothing else
		// link zig code

		internalInclude.pattern = Array.from(set)
		ruleCompile(internalInclude, { nocase: true })
	},
	internalRules: internal,
	root: ".",
}
