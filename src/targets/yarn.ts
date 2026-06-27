import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractGitignore,
	extractPackageJson,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { npmManifestParse, type PackageJson } from "./npmManifest.js"

/**
 * @since 0.12.0
 */
export function makeYarn(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractPackageJson,
			path: "package.json",
		},
		{
			extract(source, content) {
				return extractGitignore(source, content, { nocase: true })
			},
			path: ".npmignore",
		},
		{
			extract(source, content) {
				return extractGitignore(source, content, { nocase: true })
			},
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

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			fs.readFile(cwd + "/package.json", (err, content) => {
				if (err) {
					if (err.code === "ENOENT") {
						cb(null)
						return
					}
					cb(new Error("Error while initializing Yarn", { cause: err }))
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
					if (res.startsWith("/")) res = res.slice(1)
					return res
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

				// TODO: Yarn should include bundled deps

				internalInclude.pattern = Array.from(set)
				ruleCompile(internalInclude, { nocase: true })
				cb(null)
			})
		},
		internalRules: internal,
		needsSource: true, // package.json without files prop is a valid source
		root: ".",
	}
}
