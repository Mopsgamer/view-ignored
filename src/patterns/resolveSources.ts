import { dirname } from "node:path"
// oxlint-disable-next-line no-unused-vars
import type { MatcherContext } from "./matcherContext.js"
import type { Source } from "./source.js"
import type { PatternFinderOptions } from "./extractor.js"
import { signedPatternCompile } from "./signedPattern.js"

/**
 * @see {@link resolveSources}
 */
export interface ResolveSourcesOptions extends PatternFinderOptions {
	dir: string
}

/**
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 */
export async function resolveSources(options: ResolveSourcesOptions): Promise<void> {
	const { fs, ctx, cwd, target, root: _ } = options
	let dir = options.dir

	// new algo:

	// iterate from dir backwards to search ctx.external caches.
	// if cache is found populate until dir
	// else
	// iterate from root forwards
	// if got source before reached cwd, continue from CWD forwards until dir

	while (true) {
		if (ctx.external.has(dir)) break

		let foundSource = false

		for (const extractor of target.extractors) {
			const path = dir === "." ? extractor.path : dir + "/" + extractor.path
			const name = path.substring(path.lastIndexOf("/") + 1)

			const source: Source = {
				inverted: false,
				name,
				path,
				pattern: { exclude: [], include: [], compiled: null },
			}

			let buff: Buffer | undefined
			try {
				buff = await fs.promises.readFile(cwd + "/" + path)
			} catch (err) {
				const error = err as NodeJS.ErrnoException
				if (error.code === "ENOENT") continue
				source.error = error
				ctx.external.set(dir, source)
				ctx.failed.push(source)
				foundSource = true
				break
			}

			try {
				extractor.extract(source, buff, ctx)
			} catch (err) {
				if (err === "continue") {
					continue
				}
				source.error =
					err instanceof Error
						? err
						: new Error("Unknown error during source extraction", { cause: err })
				ctx.failed.push(source)
				break
			}
			ctx.external.set(dir, source)
			signedPatternCompile(source.pattern)
			foundSource = true
			break
		}

		// Inherit from parent if not found
		const parent = dirname(dir)
		if (!foundSource) {
			if (ctx.external.has(parent)) {
				ctx.external.set(dir, ctx.external.get(parent)!)
			}
		}

		if (dir === parent) break
		dir = parent
	}
}
