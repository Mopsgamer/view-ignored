import { dirname } from "node:path"
import { gitignoreMatch } from "./gitignore.js"
import type { MatcherContext } from "./matcher_context.js"
import { ArkErrors } from "arktype"

/**
 * Represents a list of positive minimatch patterns.
 */
export type Pattern = string[]

export function patternMatches(pattern: Pattern, path: string): boolean {
	for (const p of pattern) {
		const matched = gitignoreMatch(p, path)
		if (matched) {
			return true
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
export type Ignores = (cwd: string, entry: string, ctx: MatcherContext) => Promise<boolean>

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
	 * @see {@link SourceExtractor}
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
 * The result of a source extraction operation.
 * Continues extraction unless `extraction` is set to `'stop'`.
 * If `extraction` is `'stop'`, the context will be marked as failed.
 */
export type Extraction = "stop" | "continue"

/**
 * Populates a `Source` object from the content of a source file.
 * @see {@link Source.pattern} for more details.
 * @throws Error if extraction fails. Processing stops.
 */
export type SourceExtractor = (source: Source, content: Buffer<ArrayBuffer>) => Extraction

/**
 * Options for finding and extracting patterns from source files.
 * @see {@link findAndExtract}
 * @see {@link signedPatternIgnores}
 */
export interface PatternFinderOptions {
	cwd: string
	sources: string[]
	extractors: Map<string, SourceExtractor>
	ctx: MatcherContext
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
	const parent = dirname(options.dir)
	if (options.dir !== ".") {
		await findAndExtract({ ...options, dir: parent })
	}

	for (const name of options.sources) {
		let path = ""
		path = options.dir === "." ? name : options.dir + "/" + name

		const source: Source = {
			inverted: false,
			name,
			path,
			pattern: {
				exclude: [],
				include: [],
			},
		}

		let buff: Buffer<ArrayBuffer> | undefined
		try {
			buff = await options.ctx.fs.promises.readFile(options.cwd + "/" + path)!
		} catch (err) {
			const error = err as NodeJS.ErrnoException
			if (error.code === "ENOENT") {
				continue
			}
			source.error = error
			options.ctx.external.set(options.dir, source)
			options.ctx.failed = true
			break
		}

		options.ctx.external.set(options.dir, source)

		const sourceExtractor = options.extractors.get(name)
		if (!sourceExtractor) {
			const err = new Error("No extractor for source file: " + name)
			source.error = err
			options.ctx.failed = true
			break
		}

		let r: Extraction
		try {
			r = sourceExtractor(source, buff!)
		} catch (err) {
			options.ctx.failed = true
			s: switch (true) {
				case err instanceof Error:
				case err instanceof ArkErrors:
					source.error = err
					break s
				default:
					source.error = new Error("Unknown error during source extraction", { cause: err })
					break s
			}
			break
		}

		if (source.error) {
			continue
		}

		if (r === "stop") {
			options.ctx.failed = true
		}

		break
	}

	if (!options.ctx.external.has(options.dir)) {
		options.ctx.external.set(options.dir, options.ctx.external.get(parent)!)
	}
}

/**
 * @see {@link signedPatternIgnores}
 */
export interface SignedPatternIgnoresOptions extends PatternFinderOptions {
	entry: string
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
	internal: SignedPattern,
	options: SignedPatternIgnoresOptions,
): Promise<boolean> {
	const parent = dirname(options.entry)
	let source = options.ctx.external.get(parent)

	if (!source) {
		await findAndExtract({ ...options, dir: parent })

		if (options.ctx.failed) {
			return false
		}

		source = options.ctx.external.get(parent)
		if (!source) {
			return false
		}
	}

	const matcher: PatternMatcher = {
		internal,
		external: source.pattern,
	}

	try {
		let check = false

		check = patternMatches(matcher.internal.exclude, options.entry)
		if (check) {
			return true
		}

		check = patternMatches(matcher.internal.include, options.entry)
		if (check) {
			return false
		}

		if (!source.inverted) {
			check = patternMatches(matcher.external.include, options.entry)
			if (check) {
				return false
			}

			check = patternMatches(matcher.external.exclude, options.entry)
			if (check) {
				return true
			}
		} else {
			check = patternMatches(matcher.external.exclude, options.entry)
			if (check) {
				return true
			}

			check = patternMatches(matcher.external.include, options.entry)
			if (check) {
				return false
			}
		}
	} catch (err) {
		source.error = err as Error
		return false
	}

	return source.inverted
}
