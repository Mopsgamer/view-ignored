import type { Source } from "./patterns/matcher.js"
import type { MatcherContext } from "./patterns/matcher_context.js"
import type { Target } from "./targets/target.js"
import { opendir } from "./opendir.js"
import type { FsAdapter } from "./fs_adapter.js"
import EventEmitter from "node:events"
import type { Dirent } from "node:fs"
import { walk } from "./walk.js"

export type DepthMode = "files" | undefined

export type ScanOptions = {
	/**
	 * Provides the matcher to use for scanning.
	 */
	target: Target

	/**
	 * Current working directory to start the scan from.
	 * @default `(await import("node:process")).cwd().replaceAll("\\", "/")`
	 */
	cwd?: string

	/**
	 * If enabled, the scan will return files that are ignored by the target matcher.
	 * @default `false`
	 */
	invert?: boolean

	/**
	 * Starting from depth `0` means you will see
	 * children of the current working directory.
	 * @default `Infinity`
	 */
	depth?: number

	/**
	 * Return as soon as possible.
	 * @default `undefined`
	 */
	signal?: AbortSignal
	/**
	 * Requires depth >= 0.
	 * If enabled, directories will be processed faster
	 * by skipping files after first match.
	 * This makes the scan faster but affects
	 * {@link MatcherContext.totalDirs},
	 * {@link MatcherContext.totalFiles},
	 * {@link MatcherContext.totalMatchedFiles}
	 * and {@link MatcherContext.depthPaths}.
	 * @default `false`
	 */
	fastDepth?: boolean

	/**
	 * If enabled, uses streaming directory reading.
	 * @default `false`
	 */
	stream?: boolean

	/**
	 * File system interface.
	 * @default `await import("node:fs")`
	 */
	fs?: FsAdapter
}

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
	ignored: boolean
}

export type EntryListener = (info: EntryInfo) => void
// export type SourceListener = (source: Source) => void
export type EndListener = (ctx: MatcherContext) => void

export type EventMap = {
	dirent: [EntryInfo]
	source: [Source]
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

	override emit(event: "dirent", info: EntryInfo): boolean
	// override emit(event: "source", source: Source): boolean
	override emit(event: "end", ctx: MatcherContext): boolean
	override emit(event: keyof EventMap, ...args: EventMap[keyof EventMap]): boolean {
		return super.emit(event, ...args)
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

/**
 * Scan the directory for included files based on the provided targets.
 *
 * Note that this function uses `fs/promises.readFile` and `fs/promises.opendir` without options within
 * custom recursion, instead of `fs.promises.readdir` with `{ withFileTypes: true }.
 * It also normalizes paths to use forward slashes.
 * Please report any issues if you encounter problems related to this behavior.
 *
 * @param options Scan options.
 * @returns A promise that resolves to a {@link MatcherContext} containing the scan results.
 */
export async function scan(options: ScanOptions & { stream: true }): Promise<MatcherStream>
/**
 * Scan the directory for included files based on the provided targets.
 *
 * Note that this function uses `fs/promises.readFile` and `fs/promises.opendir` without options within
 * custom recursion, instead of `fs.promises.readdir` with `{ withFileTypes: true }.
 * It also normalizes paths to use forward slashes.
 * Please report any issues if you encounter problems related to this behavior.
 *
 * @param options Scan options.
 * @returns A promise that resolves to a {@link MatcherContext} containing the scan results.
 */
export async function scan(options: ScanOptions): Promise<MatcherContext>
export async function scan(options: ScanOptions): Promise<MatcherStream | MatcherContext> {
	const {
		cwd = (await import("node:process")).cwd().replaceAll("\\", "/"),
		depth: maxDepth = Infinity,
		signal = undefined,
		stream = false,
		fs = (await import("node:fs")) as FsAdapter,
	} = options

	if (maxDepth < 0) {
		throw new TypeError("Depth must be a non-negative integer")
	}

	const ctx: MatcherContext = {
		paths: new Set<string>(),
		external: new Map<string, Source>(),
		failed: false,
		depthPaths: new Map<string, number>(),
		totalFiles: 0,
		totalMatchedFiles: 0,
		totalDirs: 0,
		fs,
	}

	const s = new MatcherStream({ captureRejections: false })

	const realOptions = { ...options, cwd, depth: maxDepth, signal, fs, stream }
	if (stream) {
		const result = opendir(fs, cwd, (entry) => walk({ entry, ctx, s, ...realOptions }))
		void result.then(() => {
			for (const [dir, count] of ctx.depthPaths) {
				if (count === 0) {
					continue
				}
				ctx.paths.add(dir + "/")
			}
			s.emit("end", ctx)
		})
	} else {
		await opendir(fs, cwd, (entry) => walk({ entry, ctx, s, ...realOptions }))
		signal?.throwIfAborted()
		for (const [dir, count] of ctx.depthPaths) {
			if (count === 0) {
				continue
			}
			ctx.paths.add(dir + "/")
		}
	}

	return stream ? s : ctx
}
