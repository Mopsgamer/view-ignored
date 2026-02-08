import { EventEmitter } from "node:events"
import type { Dirent } from "node:fs"

import type { MatcherContext } from "../patterns/matcherContext.js"

import type { SignedPatternMatch } from "./signedPattern.js"

/**
 * Post-scan entry information.
 */
export type EntryInfo = {
	/**
	 * The relative path of the entry.
	 */
	path: string

	/**
	 * The directory entry.
	 */
	dirent: Dirent

	/**
	 * Whether the entry was ignored.
	 */
	match: SignedPatternMatch

	/**
	 * The matcher context.
	 */
	ctx: MatcherContext
}

/**
 * @see {@link MatcherStream} uses it for the "dirent" event.
 */
export type EntryListener = (info: EntryInfo) => void
// export type SourceListener = (source: Source) => void
/**
 * @see {@link MatcherStream} uses it for the "end" event.
 */
export type EndListener = (ctx: MatcherContext) => void

/**
 * @see {@link MatcherStream} uses it for its event map.
 */
export type EventMap = {
	dirent: [EntryInfo]
	// source: [Source]
	end: [MatcherContext]
}

/**
 * Event emitter.
 * @extends EventEmitter
 */
export class MatcherStream extends EventEmitter<EventMap> {}
