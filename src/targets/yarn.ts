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

			const patterns = new Set<string>()

			function normalize(path: string): string {
				let res = unixify(path)
				if (res.startsWith("./")) res = res.slice(2)
				if (res.startsWith("/")) res = res.slice(1)
				// Pattern should be rooted for Yarn forced includes
				return "/" + res
			}

			if (typeof dist.main === "string") patterns.add(normalize(dist.main))
			if (typeof dist.module === "string") patterns.add(normalize(dist.module))
			if (typeof dist.browser === "string") patterns.add(normalize(dist.browser))

			if (typeof dist.bin === "string") {
				patterns.add(normalize(dist.bin))
			} else if (typeof dist.bin === "object" && dist.bin !== null) {
				Object.values(dist.bin).forEach((binPath) => {
					if (typeof binPath === "string") patterns.add(normalize(binPath))
				})
			}

			internalInclude.pattern = Array.from(patterns)
			ruleCompile(internalInclude, MatchMode.unsensitive)
			cb()
		})
	},
	internalRules: internal,
	root: ".",
}
