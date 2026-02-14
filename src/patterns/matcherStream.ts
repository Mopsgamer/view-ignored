import { EventEmitter } from "node:events"
import type { Dirent } from "node:fs"

import { opendir } from "../opendir.js"
import type { MatcherContext } from "../patterns/matcherContext.js"
import type { ScanOptions, FsAdapter } from "../types.js"
import { join, relative, unixify } from "../unixify.js"
import { walkIncludes } from "../walk.js"

import type { SignedPatternMatch } from "./signedPattern.js"
import type { Source } from "./source.js"

/**
 * Post-scan entry information.
 *
 * @since 0.6.0
 */
export type EntryInfo = {
	/**
	 * The relative path of the entry.
	 *
	 * @since 0.6.0
	 */
	path: string

	/**
	 * The directory entry.
	 *
	 * @since 0.6.0
	 */
	dirent: Dirent

	/**
	 * Whether the entry was ignored.
	 *
	 * @since 0.6.0
	 */
	match: SignedPatternMatch

	/**
	 * The matcher context.
	 *
	 * @since 0.6.0
	 */
	ctx: MatcherContext
}

/**
 * @see {@link MatcherStream} uses it for the "dirent" event.
 *
 * @since 0.6.0
 */
export type EntryListener = (info: EntryInfo) => void
// export type SourceListener = (source: Source) => void
/**
 * @see {@link MatcherStream} uses it for the "end" event.
 *
 * @since 0.6.0
 */
export type EndListener = (ctx: MatcherContext) => void

/**
 * @see {@link MatcherStream} uses it for its event map.
 *
 * @since 0.6.0
 */
export type EventMap = {
	dirent: [EntryInfo]
	// source: [Source]
	end: [MatcherContext]
}

/**
 * Event emitter.
 * @extends EventEmitter
 *
 * @since 0.6.0
 */
export class MatcherStream extends EventEmitter<EventMap> {
	#timeout: NodeJS.Timeout | undefined
	#options: ScanOptions & { fs: FsAdapter; cwd: string } & { captureRejections?: boolean }
	constructor(
		options: ScanOptions & { fs: FsAdapter; cwd: string; noTimeout?: boolean } & {
			captureRejections?: boolean
		},
	) {
		super({ captureRejections: options.captureRejections })
		this.#options = options
		if (!options.noTimeout) {
			this.#timeout = setTimeout(() => {
				throw new Error(
					"Stream did not start within 5 seconds. Call MatcherStream.start() or enable noTimeout.",
				)
			}, 5e3)
		}
	}

	/**
	 * Resolves when everything is scanned.
	 *
	 * @since 0.8.0
	 */
	async start(): Promise<void> {
		clearTimeout(this.#timeout)
		const {
			target,
			cwd,
			within = ".",
			invert = false,
			depth: maxDepth = Infinity,
			signal = null,
			fastDepth = false,
			fastInternal = false,
			fs,
		} = this.#options

		const ctx: MatcherContext = {
			paths: new Map<string, SignedPatternMatch>(),
			external: new Map<string, Source>(),
			failed: [],
			depthPaths: new Map<string, number>(),
			totalFiles: 0,
			totalMatchedFiles: 0,
			totalDirs: 0,
		}

		const normalCwd = unixify(cwd)

		const scanOptions: Required<ScanOptions> = {
			cwd: normalCwd,
			within,
			depth: maxDepth,
			fastDepth,
			fastInternal,
			fs,
			invert,
			signal,
			target,
		}

		await target.init?.({ ctx, cwd, fs, signal })
		let from = join(unixify(normalCwd), within)
		await opendir(fs, from, (entry) => {
			const path = relative(normalCwd, unixify(entry.parentPath) + "/" + entry.name)
			return walkIncludes({
				path,
				entry,
				ctx,
				stream: this,
				scanOptions,
			})
		})
		this.emit("end", ctx)
	}
}
