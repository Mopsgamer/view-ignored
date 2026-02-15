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
		path: ".npmignore",
	},
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
]

const internal: SignedPattern = {
	exclude: [
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
	include: [
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
	compiled: null,
}

signedPatternCompile(internal)

/**
 * @since 0.8.1
 */
export const Bun: Target = {
	// TODO: Bun should include some paths: bins, bundled deps, nothing else.
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: Bun,
		})
	},
}
