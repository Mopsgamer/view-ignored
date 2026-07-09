import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractPackageJson,
	extractGitignore,
	type InternalRules,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { npmManifestParse, type PackageJson } from "./npmManifest.js"

/**
 * @since 0.12.0
 */
export function makeNPM(): Target {
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

	const bundledInclude: Rule = {
		compiled: [],
		excludes: false,
		list: [], // filled within init
	}
	const internalInclude: Rule = {
		compiled: [],
		excludes: false,
		list: [], // filled within init
	}

	const internal: InternalRules = {
		after: [
			ruleCompile(
				{
					compiled: null,
					excludes: true,
					list: [".npmignore", ".gitignore"],
				},
				{ nocase: true },
			),
		],
		before: [
			internalInclude,
			bundledInclude,
			ruleCompile(
				{
					compiled: null,
					excludes: true,
					list: [
						// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L16
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

						// npm-packlist ignores files with stars when publishing
						"*\\**",
					],
				},
				{ nocase: true },
			),
			ruleCompile(
				{
					compiled: null,
					excludes: false,
					list: [
						// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L287
						"/package.json",
						"README",
						"COPYING",
						"LICENSE",
						"LICENCE",
						"README.*",
						"COPYING.*",
						"LICENSE.*",
						"LICENCE.*",
					],
				},
				{ nocase: true },
			),
		],
	}

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			fs.readFile(cwd + "/package.json", (err, content) => {
				if (err) {
					if (err.code === "ENOENT") {
						cb(new Error("'package.json' not found", { cause: err }))
						return
					}
					cb(new Error("Error while initializing NPM", { cause: err }))
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

				if (typeof dist.main === "string") set.add(unixify(dist.main))
				if (typeof dist.module === "string") set.add(unixify(dist.module))
				if (typeof dist.browser === "string") set.add(unixify(dist.browser))

				if (typeof dist.bin === "string") {
					set.add(unixify(dist.bin))
				} else if (typeof dist.bin === "object" && dist.bin !== null) {
					Object.values(dist.bin).forEach((binPath) => {
						if (typeof binPath === "string") set.add(unixify(binPath))
					})
				}

				// TODO: NPM should include bundled deps

				internalInclude.list = Array.from(set)
				ruleCompile(internalInclude, { nocase: true })
				cb(null)
			})
		},
		internalRules: internal,
		needsSource: true, // package.json without files prop is a valid source
		root: ".",
	}
}
