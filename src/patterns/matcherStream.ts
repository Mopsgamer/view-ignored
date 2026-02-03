import type { SignedPatternMatch } from "./signedPattern.js"
import type { MatcherContext } from "../patterns/matcherContext.js"
import type { Dirent } from "node:fs"
import { EventEmitter } from "node:events"

/**
 * Scanned entry information.
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

export type EntryListener = (info: EntryInfo) => void
// export type SourceListener = (source: Source) => void
export type EndListener = (ctx: MatcherContext) => void

export type EventMap = {
	dirent: [EntryInfo]
	// source: [Source]
	end: [MatcherContext]
}

export class MatcherStream extends EventEmitter<EventMap> {}
