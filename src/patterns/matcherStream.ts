import type { Dirent } from "node:fs"

import { EventEmitter } from "node:events"

import type { MatcherContext, Total } from "../patterns/matcherContext.js"
import type { ScanOptions, FsAdapter } from "../types.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"

import { scanParallel } from "../scanParallel.js"
import { unixify } from "../unixify.js"
import { walkPatchResult, walkPatchTotal, propagateTotals, type WalkResult } from "../walk.js"

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
	match: RuleMatch
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
 * @augments EventEmitter
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
	start(): Promise<void> {
		const { promise, resolve, reject } = Promise.withResolvers<void>()
		this.startCb((err) => {
			if (err) {
				reject(err)
				return
			}
			resolve()
		})
		return promise
	}

	/**
	 * Resolves when everything is scanned. (Callback version)
	 *
	 * @since 0.11.0
	 */
	startCb(cb: (err: Error | null, ctx: MatcherContext) => void): void {
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
			external: new Map<string, Resource>(),
			failed: [],
			paths: new Map<string, RuleMatch>(),
			total: new Map<string, Total>([[".", { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 }]]),
		}

		const normalCwd = unixify(cwd)

		const scanOptions: Required<ScanOptions> = {
			cwd: normalCwd,
			depth: maxDepth,
			fastDepth,
			fastInternal,
			fs,
			invert,
			signal,
			target,
			within,
		}

		const startScan = () => {
			scanParallel(
				{
					external: ctx.external,
					failed: ctx.failed,
					onResult: (result) => {
						if ("dir" in result) {
							walkPatchTotal(ctx, scanOptions.depth, result as any)
						} else {
							walkPatchResult(ctx, result as WalkResult)
						}
					},
					scanOptions,
					stream: this,
					within,
				},
				(err) => {
					if (err) {
						cb(err, null as any)
						return
					}
					propagateTotals(ctx.total)
					cb(null, ctx)
					this.emit("end", ctx)
				},
			)
		}

		if (target.init) {
			target.init({ cwd: normalCwd, fs, signal, target }, (err) => {
				if (err) {
					cb(err, null as any)
					return
				}
				startScan()
			})
		} else {
			startScan()
		}
	}
}
