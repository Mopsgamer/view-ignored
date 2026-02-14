import { type } from "arktype"

import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractPackageJsonNocase,
	extractGitignoreNocase,
} from "../patterns/index.js"
import { join, unixify } from "../unixify.js"

import type { Target } from "./target.js"

const extractors: Extractor[] = [
	{
		extract: extractPackageJsonNocase,
		path: "package.json",
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

const include = [
	// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
	"/package.json",
	"/README",
	"/README.*",
	"/LICENSE",
	"/LICENSE.*",
	"/LICENCE",
	"/LICENCE.*",
]

const internal: SignedPattern = {
	exclude: [
		// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L26
		"/package.tgz",

		".github",
		".git",
		".hg",
		"node_modules",

		".npmignore",
		".gitignore",

		".#*",
		".DS_Store",
	],
	include: [...include],
	compiled: null,
}

signedPatternCompile(internal, { nocase: true })

const npmManifest = type({
	"main?": "string",
	"module?": "string",
	"browser?": "string",
	"bin?": "string | Record<string, string>",
})

const parse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(npmManifest)

/**
 * @since 0.6.0
 */
export const Yarn: Target = {
	async init({ fs, cwd }) {
		let content: Buffer
		const normalCwd = unixify(cwd)
		try {
			content = await fs.promises.readFile(normalCwd + "/" + "package.json")
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return // no package.json
			}
			throw new Error("Error while initializing Yarn's ignoring implementation", { cause: error })
		}

		const dist = parse(content.toString())
		if (dist instanceof type.errors) {
			throw new Error("Invalid 'package.json': " + dist.summary, { cause: dist })
		}

		// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L215-L231

		const set = new Set<string>(include)

		function normal(path: string): string {
			const result = unixify(join(normalCwd, path)).substring(normalCwd.length)
			return result
		}

		if (dist.main) set.add(normal(dist.main))
		if (dist.module) set.add(normal(dist.module))
		if (dist.browser) set.add(normal(dist.browser))
		if (typeof dist.bin === "string") {
			set.add(normal(dist.bin))
		} else if (typeof dist.bin === "object" && dist.bin !== null) {
			Object.values(dist.bin).forEach((binPath) => set.add(normal(binPath)))
		}

		internal.include.length = 0
		internal.include.push(...set)
		signedPatternCompile(internal, { nocase: true })
	},
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: Yarn,
		})
	},
}
