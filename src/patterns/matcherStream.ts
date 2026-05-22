import type { MatcherContext, Total } from "../patterns/matcherContext.js"
import type { ScanOptions, FsAdapter } from "../types.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"
import type {
	EventMap,
	EventListener,
	EventListenerObject,
} from "./matcherStreamTypes.js"

import { scanParallel } from "../scanParallel.js"
import { unixify } from "../unixify.js"
import { walkPatchResult, walkPatchTotal, propagateTotals, type WalkResult } from "../walk.js"

export type { EntryInfo, EntryListener, EndListener, EventMap } from "./matcherStreamTypes.js"

/**
 * Event emitter.
 * @augments EventTarget
 *
 * @since 0.6.0
 */
export class MatcherStream extends EventTarget {
	#timeout: NodeJS.Timeout | undefined
	#options: ScanOptions & { fs: FsAdapter; cwd: string } & { captureRejections?: boolean }
	constructor(
		options: ScanOptions & { fs: FsAdapter; cwd: string; noTimeout?: boolean } & {
			captureRejections?: boolean
		},
	) {
		super()
		this.#options = options
		if (!options.noTimeout) {
			this.#timeout = setTimeout(() => {
				throw new Error(
					"Stream did not start within 5 seconds. Call MatcherStream.start() or enable noTimeout.",
				)
			}, 5e3)
		}
	}

	override addEventListener<K extends keyof EventMap>(
		type: K,
		callback: EventListenerObject<K> | EventListener<K> | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		super.addEventListener(type as string, callback as any, options)
	}

	override removeEventListener<K extends keyof EventMap>(
		type: K,
		callback: EventListenerObject<K> | EventListener<K> | null,
		options?: boolean | EventListenerOptions,
	): void {
		super.removeEventListener(type as string, callback as any, options)
	}

	override dispatchEvent(event: EventMap[keyof EventMap]): boolean {
		return super.dispatchEvent(event as Event)
	}

	/**
	 * Resolves when everything is scanned.
	 *
	 * @since 0.8.0
	 */
	start(): Promise<void> {
		let resolve!: () => void
		let reject!: (err: Error) => void
		const promise = new Promise<void>((res, rej) => {
			resolve = res
			reject = rej
		})
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
					this.dispatchEvent(new CustomEvent("end", { detail: ctx }))
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
