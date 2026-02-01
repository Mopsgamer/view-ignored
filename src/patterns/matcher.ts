import { dirname } from "node:path"
import type { MatcherContext } from "./matcherContext.js"
import type { FsAdapter } from "../types.js"
import type { Source } from "./source.js"

/**
 * Populates a `Source` object from the content of a source file.
 * @see {@link Source.pattern} for more details.
 * @throws Error if extraction fails. Processing stops.
 */
export type ExtractorFn = (
	source: Source,
	content: Buffer<ArrayBuffer>,
	ctx: MatcherContext,
) => void

/**
 * Defines a method for extracting patterns from a specific source file.
 */
export interface Extractor {
	path: string
	extract: ExtractorFn
}

/**
 * Options for finding and extracting patterns from source files.
 * @see {@link sourcesBackwards}
 * @see {@link signedPatternIgnores}
 */
export interface PatternFinderOptions {
	fs: FsAdapter
	ctx: MatcherContext
	cwd: string
	extractors: Extractor[]
}

/**
 * @see {@link sourcesBackwards}
 */
export interface SourcesBackwardsOptions extends PatternFinderOptions {
	dir: string
}

/**
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 */
export async function sourcesBackwards(options: SourcesBackwardsOptions): Promise<void> {
	const { fs, ctx, cwd, extractors } = options
	let dir = options.dir

	while (true) {
		if (ctx.external.has(dir)) break

		let foundSource = false

		for (const extractor of extractors) {
			const path = dir === "." ? extractor.path : dir + "/" + extractor.path
			const name = path.substring(path.lastIndexOf("/") + 1)

			const source: Source = {
				inverted: false,
				name,
				path,
				pattern: { exclude: [], include: [] },
			}

			let buff: Buffer<ArrayBuffer> | undefined
			try {
				buff = await fs.promises.readFile(cwd + "/" + path)
			} catch (err) {
				const error = err as NodeJS.ErrnoException
				if (error.code === "ENOENT") continue
				source.error = error
				ctx.external.set(dir, source)
				ctx.failed = true
				foundSource = true
				break
			}

			ctx.external.set(dir, source)
			try {
				extractor.extract(source, buff, ctx)
			} catch (err) {
				ctx.failed = true
				source.error =
					err instanceof Error
						? err
						: new Error("Unknown error during source extraction", { cause: err })
				break
			}
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
