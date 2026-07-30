import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	extractPackageJson,
	extractNpmignore,
	type InternalRules,
} from "../patterns/index.js"
import {
	npmManifestParse,
	type PackageJson,
	extractManifestIncludes,
	symlinkRule,
	makeDirectPathsRule,
} from "./npmManifest.js"

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
			extract: extractNpmignore,
			path: ".npmignore",
		},
		{
			extract: extractNpmignore,
			path: ".gitignore",
		},
	]

	const directPathsInclude: Record<string, string> = Object.create(null)

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
			symlinkRule,
			makeDirectPathsRule(directPathsInclude),
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

				extractManifestIncludes(dist, directPathsInclude)

				// TODO: NPM should include bundled deps

				cb(null)
			})
		},
		internalRules: internal,
		root: ".",
	}
}
