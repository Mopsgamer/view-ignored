import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractPackageJsonNocase,
	extractGitignoreNocase,
} from "../patterns/index.js"
import { join, unixify } from "../unixify.js"
import { npmManifestParse } from "./npmManifest.js"

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

const internalInclude: Rule = {
	compiled: [],
	excludes: false,
	pattern: [],
}

const internal: Rule[] = [
	internalInclude,
	ruleCompile({
		compiled: null,
		excludes: true,
		pattern: [
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
	}),
	ruleCompile(
		{
			compiled: null,
			excludes: false,
			pattern: [
				// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
				"/package.json",
				"/README",
				"/README.*",
				"/LICENSE",
				"/LICENSE.*",
				"/LICENCE",
				"/LICENCE.*",
			],
		},
		{ nocase: true },
	),
]

/**
 * @since 0.6.0
 */
export const Yarn: Target = <Target>{
	extractors,
	ignores: ruleTest,
	init({ fs, cwd }, cb) {
		const normalCwd = unixify(cwd)
		fs.readFile(normalCwd + "/" + "package.json", (err, content) => {
			if (err) {
				const error = err as NodeJS.ErrnoException
				if (error.code === "ENOENT") {
					cb()
					return
				}
				cb(new Error("Error while initializing Yarn", { cause: error }))
				return
			}

			let dist: any
			try {
				dist = npmManifestParse(content!.toString())
			} catch {
				// handled by extractor
			}

			if (!dist || typeof dist !== "object") {
				cb()
				return
			}

			const set = new Set<string>()

			function normal(path: string): string {
				return unixify(join(normalCwd, path)).substring(normalCwd.length)
			}

			if (typeof dist.main === "string") set.add(normal(dist.main))
			if (typeof dist.module === "string") set.add(normal(dist.module))
			if (typeof dist.browser === "string") set.add(normal(dist.browser))

			if (typeof dist.bin === "string") {
				set.add(normal(dist.bin))
			} else if (typeof dist.bin === "object" && dist.bin !== null) {
				Object.values(dist.bin).forEach((binPath) => {
					if (typeof binPath === "string") set.add(normal(binPath))
				})
			}

			internalInclude.pattern = Array.from(set)
			ruleCompile(internalInclude, { nocase: true })
			cb()
		})
	},
	internalRules: internal,
	isIgnoreFile: (path) => extractors.some((e) => e.path === path),
	root: ".",
}
