import { dirname } from "node:path"
import { gitignoreMatch } from "./gitignore.js"
import type { MatcherContext } from "./matcher_context.js"
import { ArkErrors } from "arktype"
import type { FsAdapter } from "../types.js";

/**
 * Represents a list of positive minimatch patterns.
 */
export type Pattern = string[]

export function patternMatches(pattern: Pattern, path: string): false | string {
	for (const p of pattern) {
		const matched = gitignoreMatch(p, path)
		if (matched) {
			return p
		}
	}
	return false
}

/**
 * Represents a set of include and exclude patterns.
 * These patterns are positive minimatch patterns.
 *
 * @see {@link PatternMatcher}
 * @see {@link signedPatternIgnores}
 */
export type SignedPattern = {
	include: Pattern
	exclude: Pattern
}

/**
 * @see {@link signedPatternIgnores}
 */
export type SignedPatternMatch =
	| {
			kind:
				| "none"
				| "no-match"
				| "invalid-internal-pattern"
				| "missing-source"
				| "broken-source"
				| "invalid-pattern"
			ignored: boolean
	  }
	| {
			kind: "internal" | "external"
			negated: boolean
			pattern: string
			ignored: boolean
	  }

/**
 * Combined internal and external patterns for matching.
 *
 * @see {@link signedPatternIgnores}
 */
export type PatternMatcher = {
	internal: SignedPattern
	external: SignedPattern
}

/**
 * Checks whether a given entry path should be ignored based on its patterns.
 * @see {@link findAndExtract}
 * @see {@link signedPatternIgnores}
 * @see {@link https://github.com/Mopsgamer/view-ignored/tree/main/src/targets} for usage examples.
 */
export type Ignores = (
	fs: FsAdapter,
	cwd: string,
	entry: string,
	ctx: MatcherContext,
) => Promise<SignedPatternMatch>

/**
 * Represents a source of patterns for matching paths.
 */
export type Source = {
	/**
	 * Patterns defined within the source file.
	 * Those patterns are for ignoring files.
	 * @see {@link PatternMatcher}
	 * @see {@link signedPatternIgnores}
	 */
	pattern: SignedPattern

	/**
	 * Name of the source file.
	 */
	name: string

	/**
	 * Relative path to the source file.
	 */
	path: string

	/**
	 * Indicates if the matching logic is inverted.
	 * For example, `package.json` `files` field inverts the matching logic,
	 * because it specifies files to include rather than exclude.
	 * @see {@link PatternMatcher}
	 * @see {@link signedPatternIgnores}
	 */
	inverted: boolean

	/**
	 * Error encountered during extraction, if any.
	 * @see {@link ExtractorFn}
	 */
	error?: ArkErrors | Error
}

/**
 * Adds a negatable pattern to the source's pattern lists.
 * Strips the leading '!' for include patterns,
 * and adds to exclude patterns otherwise.
 */
export function sourcePushNegatable(source: Source, pattern: string): void {
	let exclude = source.pattern.exclude,
		include = source.pattern.include
	if (source.inverted) {
		;[exclude, include] = [include, exclude]
	}

	let dist = exclude

	if (pattern.startsWith("!")) {
		dist = include
		pattern = pattern.substring(1)
	}

	dist.push(pattern)
}

/**
 * Populates a `Source` object from the content of a source file.
 * @see {@link Source.pattern} for more details.
 * @throws Error if extraction fails. Processing stops.
 */
export type ExtractorFn = (
	source: Source,
	content: Buffer<ArrayBuffer>,
	ctx: MatcherContext,
) => void

/**
 * Defines a method for extracting patterns from a specific source file.
 */
export interface Extractor {
	path: string
	extract: ExtractorFn
}

/**
 * Options for finding and extracting patterns from source files.
 * @see {@link findAndExtract}
 * @see {@link signedPatternIgnores}
 */
export interface PatternFinderOptions {
	fs: FsAdapter
	ctx: MatcherContext
	cwd: string
	extractors: Extractor[]
}

/**
 * @see {@link findAndExtract}
 */
export interface FindAndExtractOptions extends PatternFinderOptions {
	dir: string
}

/**
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 */
export async function findAndExtract(options: FindAndExtractOptions): Promise<void> {
	const { fs, ctx, cwd, extractors } = options
	let dir = options.dir

	while (true) {
		if (ctx.external.has(dir)) break

		let foundSource = false

		for (const extractor of extractors) {
			const path = dir === "." ? extractor.path : dir + "/" + extractor.path
			const name = path.substring(path.lastIndexOf("/") + 1)

			const source: Source = {
				inverted: false,
				name,
				path,
				pattern: { exclude: [], include: [] },
			}

			let buff: Buffer<ArrayBuffer> | undefined
			try {
				buff = await fs.promises.readFile(cwd + "/" + path)
			} catch (err) {
				const error = err as NodeJS.ErrnoException
				if (error.code === "ENOENT") continue
				source.error = error
				ctx.external.set(dir, source)
				ctx.failed = true
				foundSource = true
				break
			}

			ctx.external.set(dir, source)
			try {
				extractor.extract(source, buff, ctx)
			} catch (err) {
				ctx.failed = true
				source.error =
					err instanceof Error
						? err
						: new Error("Unknown error during source extraction", { cause: err })
				break
			}
			foundSource = true
			break
		}

		// Inherit from parent if not found
		const parent = dirname(dir)
		if (!foundSource) {
			if (ctx.external.has(parent)) {
				ctx.external.set(dir, ctx.external.get(parent)!)
			}
		}

		if (dir === parent) break
		dir = parent
	}
}

/**
 * @see {@link signedPatternIgnores}
 */
export interface SignedPatternIgnoresOptions extends PatternFinderOptions {
	entry: string
	internal: SignedPattern
}

/**
 * Checks whether a given entry should be ignored based on internal and external patterns.
 * Populates unknown sources using {@link findAndExtract}.
 *
 * Algorithm:
 * 1. Check internal exclude patterns. If matched, return true.
 * 2. Check internal include patterns. If matched, return false.
 * 3. Check external patterns:
 *    - If not inverted:
 *      a. Check external include patterns. If matched, return false.
 *      b. Check external exclude patterns. If matched, return true.
 *    - If inverted:
 *      a. Check external exclude patterns. If matched, return true.
 *      b. Check external include patterns. If matched, return false.
 * 4. If no patterns matched, return true if external is inverted, else false.
 */
export async function signedPatternIgnores(
	options: SignedPatternIgnoresOptions,
): Promise<SignedPatternMatch> {
	const parent = dirname(options.entry)
	let source = options.ctx.external.get(parent)

	if (!source) {
		await findAndExtract({ ...options, dir: parent })

		if (options.ctx.failed) {
			return { kind: "broken-source", ignored: false }
		}

		source = options.ctx.external.get(parent)
	}

	const internal = options.internal

	try {
		let check: false | string = false

		check = patternMatches(internal.exclude, options.entry)
		if (check) {
			// return true
			return { kind: "internal", negated: true, pattern: check, ignored: true }
		}

		check = patternMatches(internal.include, options.entry)
		if (check) {
			// return false
			return { kind: "internal", negated: false, pattern: check, ignored: false }
		}
	} catch {
		options.ctx.failed = true
		return { kind: "invalid-internal-pattern", ignored: false }
	}

	if (!source) {
		return { kind: "no-match", ignored: false }
	}

	const external = source.pattern

	try {
		let check: false | string = false

		if (!source.inverted) {
			check = patternMatches(external.include, options.entry)
			if (check) {
				// return false
				return { kind: "external", negated: true, pattern: check, ignored: false }
			}

			check = patternMatches(external.exclude, options.entry)
			if (check) {
				// return true
				return { kind: "external", negated: false, pattern: check, ignored: true }
			}
		} else {
			check = patternMatches(external.exclude, options.entry)
			if (check) {
				// return true
				return { kind: "external", negated: false, pattern: check, ignored: true }
			}

			check = patternMatches(external.include, options.entry)
			if (check) {
				// return false
				return { kind: "external", negated: true, pattern: check, ignored: false }
			}
		}
	} catch (err) {
		source.error = err as Error
		options.ctx.failed = true
		return { kind: "invalid-pattern", ignored: false }
	}

	return { kind: "no-match", ignored: source.inverted }
}
