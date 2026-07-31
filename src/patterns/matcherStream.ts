import type { MatcherContext } from "../patterns/matcherContext.js"
import type { ScanBrowserOptions } from "../types.js"
import type { EventMap, EventListener, EventListenerObject } from "./matcherStreamTypes.js"

import { browserScanCb } from "../browserScanCb.js"

export type { EntryInfo, EntryListener, EndListener, EventMap } from "./matcherStreamTypes.js"

export interface AddEventListenerOptions {
	capture?: boolean
	once?: boolean
	passive?: boolean
	signal?: AbortSignal
}

/**
 * Event emitter.
 * @augments EventTarget
 *
 * @since 0.6.0
 */
export class MatcherStream extends EventTarget {
	#timeout: NodeJS.Timeout | undefined
	#options: ScanBrowserOptions
	constructor(options: ScanBrowserOptions & { noTimeout?: boolean }) {
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
		// oxlint-disable-next-line typescript/no-explicit-any
		super.addEventListener(type, callback as any, options)
	}

	override removeEventListener<K extends keyof EventMap>(
		type: K,
		callback: EventListenerObject<K> | EventListener<K> | null,
		options?: boolean | EventListenerOptions,
	): void {
		// oxlint-disable-next-line typescript/no-explicit-any
		super.removeEventListener(type, callback as any, options)
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
		const { resolve, reject, promise } = Promise.withResolvers<void>()
		this.startCb((err) => {
			if (err) {
				reject(err)
				return
			}
			resolve()
		})
		return promise
	}

	#scanCb = browserScanCb.bind(this)

	/**
	 * Resolves when everything is scanned. (Callback version)
	 *
	 * @since 0.11.0
	 */
	startCb(cb: (err: Error | null, ctx: MatcherContext) => void): void {
		clearTimeout(this.#timeout)
		this.#scanCb(this.#options, (err, ctx) => {
			cb(err, ctx)
			if (ctx) this.dispatchEvent(new CustomEvent("end", { detail: ctx }))
		})
	}

	async *[Symbol.asyncIterator](): AsyncIterator<EventMap[keyof EventMap]> {
		const queue: EventMap[keyof EventMap][] = []
		let done = false
		let error: Error | null = null
		let resolveNext: (() => void) | null = null

		const onDirent = (event: EventMap["dirent"]) => {
			queue.push(event)
			if (resolveNext) {
				resolveNext()
				resolveNext = null
			}
		}

		const onEnd = (event: EventMap["end"]) => {
			queue.push(event)
			done = true
			if (resolveNext) {
				resolveNext()
				resolveNext = null
			}
			cleanup()
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		this.addEventListener("dirent", onDirent as any)
		// oxlint-disable-next-line typescript/no-explicit-any
		this.addEventListener("end", onEnd as any)

		let cleaned = false
		const cleanup = () => {
			if (cleaned) return
			cleaned = true
			// oxlint-disable-next-line typescript/no-explicit-any
			this.removeEventListener("dirent", onDirent as any)
			// oxlint-disable-next-line typescript/no-explicit-any
			this.removeEventListener("end", onEnd as any)
		}

		const startPromise = this.start().then(
			() => {
				done = true
				if (resolveNext) {
					resolveNext()
					resolveNext = null
				}
			},
			(err) => {
				error = err
				if (resolveNext) {
					resolveNext()
					resolveNext = null
				}
			},
		)

		try {
			while (true) {
				if (queue.length > 0) {
					yield queue.shift()!
					continue
				}
				if (error) {
					throw error
				}
				if (done) {
					break
				}
				// oxlint-disable-next-line eslint/no-await-in-loop, no-await-in-loop
				await new Promise<void>((resolve) => {
					resolveNext = resolve
				})
			}
			await startPromise
		} finally {
			cleanup()
		}
	}
}
