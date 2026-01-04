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
 */
export type SignedPattern = {
	include: Pattern
	exclude: Pattern
}

/**
 * Combined internal and external patterns for matching.
 *
 * `exclude` patterns take precedence over `include` patterns.
 *
 * `internal` patterns take precedence over `external` patterns.
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
	if (pattern.startsWith("!")) {
		source.pattern.include.push(pattern.substring(1))
		return
	}
	source.pattern.exclude.push(pattern)
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
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 */
export async function findAndExtract(
	cwd: string,
	directory: string,
	sources: string[],
	matcher: Map<string, SourceExtractor>,
	ctx: MatcherContext,
): Promise<void> {
	const parent = dirname(directory)
	if (directory !== ".") {
		await findAndExtract(cwd, parent, sources, matcher, ctx)
	}

	for (const name of sources) {
		let path = ""
		path = directory === "." ? name : directory + "/" + name

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
			buff = await ctx.fsp.promises.readFile(cwd + "/" + path)!
		} catch (err) {
			const error = err as NodeJS.ErrnoException
			if (error.code === "ENOENT") {
				continue
			}
			source.error = error
			ctx.external.set(directory, source)
			ctx.failed = true
			break
		}

		ctx.external.set(directory, source)

		const sourceExtractor = matcher.get(name)
		if (!sourceExtractor) {
			const err = new Error("No extractor for source file: " + name)
			source.error = err
			ctx.failed = true
			break
		}

		let r: Extraction
		try {
			r = sourceExtractor(source, buff!)
		} catch (err) {
			ctx.failed = true
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
			ctx.failed = true
		}

		break
	}

	if (!ctx.external.has(directory)) {
		ctx.external.set(directory, ctx.external.get(parent)!)
	}
}

/**
 * Checks whether a given entry should be ignored based on internal and external patterns.
 * Populates unknown sources using {@link findAndExtract}.
 */
export async function signedPatternIgnores(
	internal: SignedPattern,
	cwd: string,
	entry: string,
	sources: string[],
	sourceMap: Map<string, SourceExtractor>,
	ctx: MatcherContext,
): Promise<boolean> {
	const parent = dirname(entry)
	let source = ctx.external.get(parent)
	if (!source) {
		await findAndExtract(cwd, parent, sources, sourceMap, ctx)
		if (ctx.failed) {
			return false
		}
		source = ctx.external.get(parent)
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

		check = patternMatches(matcher.internal.exclude, entry)
		if (check) {
			return true
		}

		check = patternMatches(matcher.internal.include, entry)
		if (check) {
			return false
		}

		if (!source.inverted) {
			check = patternMatches(matcher.external.include, entry)
			if (check) {
				return source.inverted
			}

			check = patternMatches(matcher.external.exclude, entry)
			if (check) {
				return !source.inverted
			}
		} else {
			check = patternMatches(matcher.external.exclude, entry)
			if (check) {
				return !source.inverted
			}

			check = patternMatches(matcher.external.include, entry)
			if (check) {
				return source.inverted
			}
		}
	} catch (err) {
		source.error = err as Error
		return false
	}

	return source.inverted
}
