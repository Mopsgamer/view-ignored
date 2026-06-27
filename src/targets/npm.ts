import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractPackageJson,
	extractGitignore,
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
				// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L16
				".npmignore",
				".gitignore",
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
		}),
		ruleCompile({
			compiled: null,
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
		}),
	]

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

				// TODO: NPM should include bundled deps

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
