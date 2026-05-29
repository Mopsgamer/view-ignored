import type { Extractor, Rule } from "../patterns/index.js"
import type { PackageJson } from "./npmManifest.js"
import type { Target } from "./target.js"

import {
	MatchMode,
	makeGitignoreExtractor,
	makePackageJsonExtractor,
	ruleCompile,
	ruleTest,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { npmManifestParse } from "./npmManifest.js"

const extractors: Extractor[] = [
	makePackageJsonExtractor("package.json", MatchMode.unsensitive),
	makeGitignoreExtractor(".npmignore", MatchMode.unsensitive),
	makeGitignoreExtractor(".gitignore", MatchMode.unsensitive),
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
		MatchMode.unsensitive,
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
		fs.readFile(normalCwd + "/package.json", (err, content) => {
			if (err) {
				const error = err as NodeJS.ErrnoException
				if (error.code === "ENOENT") {
					cb()
					return
				}
				cb(new Error("Error while initializing Yarn", { cause: error }))
				return
			}

			let dist: PackageJson
			try {
				dist = npmManifestParse(content!.toString())
			} catch (error) {
				cb(new Error("Invalid 'package.json'", { cause: error }))
				return
			}

			const set = new Set<string>()

			function normal(path: string): string {
				let res = unixify(path)
				if (res.startsWith("./")) res = res.slice(2)
				if (res.startsWith("/")) res = res.slice(1)
				return "/" + res
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
			ruleCompile(internalInclude, MatchMode.unsensitive)
			cb()
		})
	},
	internalRules: internal,
	root: ".",
}
