import type { MatcherContext } from "../../../out/patterns/matcherContext.js"
import type { ScanOptions, FsAdapter } from "../../../out/types.js"
import type {
	EventMap,
	EventListener,
	EventListenerObject,
} from "../../../out/patterns/matcherStreamTypes.js"

export type {
	EntryInfo,
	EntryListener,
	EndListener,
	EventMap,
} from "../../../out/patterns/matcherStreamTypes.js"

/**
 * Event emitter.
 * @augments EventTarget
 *
 * @since 0.6.0
 */
export declare class MatcherStream extends EventTarget {
	constructor(
		options: ScanOptions & {
			fs: FsAdapter
			cwd: string
			noTimeout?: boolean
		} & {
			captureRejections?: boolean
		},
	)
	addEventListener<K extends keyof EventMap>(
		type: K,
		callback: EventListenerObject<K> | EventListener<K> | null,
		options?: boolean | AddEventListenerOptions,
	): void
	removeEventListener<K extends keyof EventMap>(
		type: K,
		callback: EventListenerObject<K> | EventListener<K> | null,
		options?: boolean | EventListenerOptions,
	): void
	dispatchEvent(event: EventMap[keyof EventMap]): boolean
	/**
	 * Resolves when everything is scanned.
	 *
	 * @since 0.8.0
	 */
	start(): Promise<void>
	/**
	 * Resolves when everything is scanned. (Callback version)
	 *
	 * @since 0.11.0
	 */
	startCb(cb: (err: Error | null, ctx: MatcherContext) => void): void
}
