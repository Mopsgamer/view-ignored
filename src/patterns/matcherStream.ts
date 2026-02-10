import { EventEmitter } from "node:events"
import type { Dirent } from "node:fs"

import type { MatcherContext } from "../patterns/matcherContext.js"

import type { SignedPatternMatch } from "./signedPattern.js"

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
export class MatcherStream extends EventEmitter<EventMap> {}
