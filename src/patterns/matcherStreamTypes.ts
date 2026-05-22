import type { Dirent } from "node:fs"

import type { MatcherContext } from "./matcherContext.js"
import type { RuleMatch } from "./rule.js"

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
	dirent: CustomEvent<EntryInfo>
	end: CustomEvent<MatcherContext>
}

/**
 * @see {@link MatcherStream} uses it for its event map.
 *
 * @since 0.11.0
 */
export interface EventListener<K extends keyof EventMap> {
	(evt: EventMap[K]): void
}

/**
 * @see {@link MatcherStream} uses it for its event map.
 *
 * @since 0.11.0
 */
export interface EventListenerObject<K extends keyof EventMap> {
	handleEvent(object: EventMap[K]): void
}
