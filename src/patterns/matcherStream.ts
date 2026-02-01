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

/**
 * Stream interface for scan results.
 */
export class MatcherStream extends EventEmitter<EventMap> {
	override addListener(event: "dirent", listener: EntryListener): this
	// override addListener(event: "source", listener: SourceListener): this
	override addListener(event: "end", listener: EndListener): this
	override addListener(event: keyof EventMap, listener: (...args: any[]) => void): this {
		super.addListener(event, listener)
		return this
	}

	override emit<T extends keyof EventMap>(
		eventName: T | keyof EventMap,
		...args: T extends keyof EventMap ? EventMap[T] : never
	): boolean {
		return super.emit<T>(eventName, ...args)
	}

	override on(event: "dirent", listener: EntryListener): this
	// override on(event: "source", listener: SourceListener): this
	override on(event: "end", listener: EndListener): this
	override on(event: keyof EventMap, listener: (...args: any[]) => void): this {
		super.on(event, listener)
		return this
	}

	override once(event: "dirent", listener: EntryListener): this
	// override once(event: "source", listener: SourceListener): this
	override once(event: "end", listener: EndListener): this
	override once(event: keyof EventMap, listener: (...args: any[]) => void): this {
		super.once(event, listener)
		return this
	}

	override prependListener(event: "dirent", listener: EntryListener): this
	// override prependListener(event: "source", listener: SourceListener): this
	override prependListener(event: "end", listener: EndListener): this
	override prependListener(event: keyof EventMap, listener: (...args: any[]) => void): this {
		super.prependListener(event, listener)
		return this
	}

	override prependOnceListener(event: "dirent", listener: EntryListener): this
	// override prependOnceListener(event: "source", listener: SourceListener): this
	override prependOnceListener(event: "end", listener: EndListener): this
	override prependOnceListener(event: keyof EventMap, listener: (...args: any[]) => void): this {
		super.prependOnceListener(event, listener)
		return this
	}

	override listeners(event: "dirent"): EntryListener[]
	// override listeners(event: "source"): SourceListener[]
	override listeners(event: "end"): EndListener[]
	override listeners(event: keyof EventMap): Array<Function> {
		return super.listeners(event)
	}
}
