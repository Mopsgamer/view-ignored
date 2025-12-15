import * as fsp from 'node:fs/promises'
import { dirname } from 'node:path'
import { gitignoreMatch } from './gitignore.js'

/**
 * The results and statistics of a scanning operation.
 */
export type MatcherContext = {
  /**
   * `Set` can be sorted, but `view-ignored`
   * does not sort paths.
   * @example
   * new Set(sort(new Set(['a/b', 'a/a'])))
   */
  paths: Set<string>
  /**
   * Maps directory paths to their corresponding sources.
   * @example
   * "src" => Source
   */
  external: Map<string, Source>
  /**
   * Maps directory paths to the quantity of path segments they contain.
   * @example
   * "src/components" => 2
   */
  depthPaths: Map<string, number>
  /**
   * Any errors encountered while processing source files.
   */
  sourceErrors: Error[]
  /**
   * Total number of files scanned.
   */
  totalFiles: number
  /**
   * Total number of files matched by the target.
   */
  totalMatchedFiles: number
  /**
   * Total number of directories scanned.
   */
  totalDirs: number
}

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
 */
export type SignedPattern = {
  include: Pattern
  exclude: Pattern
}

/**
 * Combined internal and external patterns for matching.
 * Used in {@link signedPatternIgnores} function.
 */
export type PatternMatcher = {
  internal: SignedPattern
  external: SignedPattern
}

/**
 * Checks whether a given path should be ignored based on its patterns.
 * @see {@link findAndExtract}
 * @see {@link signedPatternIgnores}
 * @see {@link https://github.com/Mopsgamer/view-ignored/tree/main/src/targets} for usage examples.
 */
export type PathChecker = (path: string, isDir: boolean, ctx: MatcherContext) => Promise<boolean>

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
   * Indicates if the matching logic is inverted.
   * For example, `package.json` `files` field inverts the matching logic,
   * because it specifies files to include rather than exclude.
   */
  inverted: boolean
}

/**
 * Populates a `Source` object from the content of a source file.
 * @see {@link Source.pattern} for more details.
 */
export type SourceExtractor = (source: Source, content: Buffer<ArrayBuffer>) => void

/**
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 */
export async function findAndExtract(
  directory: string,
  sources: string[],
  matcher: Map<string, SourceExtractor>,
  ctx: MatcherContext,
): Promise<void> {
  const keys: string[] = []
  for (const sourceFileName of sources) {
    for (;;) {
      let buff: Buffer<ArrayBuffer> | undefined
      try {
        buff = await fsp.readFile(directory + '/' + sourceFileName)
      }
      catch (err) {
        const error = err as NodeJS.ErrnoException
        if (error.code !== 'ENOENT') {
          ctx.sourceErrors.push(error)
          return
        }
      }

      const dir = dirname(directory)
      if (!ctx.external.has(directory)) {
        keys.push(directory)
      }
      if (!buff) {
        if (directory === '.') {
          break
        }
        directory = dir
        continue
      }

      if (directory === '.' && !keys.length) {
        break
      }

      const sourceExtractor = matcher.get(sourceFileName)
      if (!sourceExtractor) {
        const err = new Error('No extractor for source file: ' + sourceFileName)
        ctx.sourceErrors.push(err)
        break
      }

      const source: Source = {
        inverted: false,
        name: sourceFileName,
        pattern: {
          exclude: [],
          include: [],
        },
      }
      try {
        sourceExtractor(source, buff!)
      }
      catch (err) {
        ctx.sourceErrors.push(err as Error)
        break
      }
      for (const key of keys) {
        const m = ctx.external.get(key)
        if (!m) {
          ctx.external.set(key, source)
        }
      }
      if (directory === '.') {
        return
      }
      keys.length = 0
      directory = dir
    }
  }
}

/**
 * Checks whether a given file should be ignored based on internal and external patterns.
 * Populates unknown sources using {@link findAndExtract}.
 */
export async function signedPatternIgnores(
  internal: SignedPattern,
  file: string,
  sources: string[],
  sourceMap: Map<string, SourceExtractor>,
  ctx: MatcherContext,
): Promise<boolean> {
  const parent = dirname(file)
  let source = ctx.external.get(parent)
  if (!source) {
    await findAndExtract(parent, sources, sourceMap, ctx)
    if (ctx.sourceErrors.length) {
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

    check = patternMatches(matcher.internal.exclude, file)
    if (check) {
      return true
    }

    check = patternMatches(matcher.internal.include, file)
    if (check) {
      return false
    }

    check = patternMatches(matcher.external.exclude, file)
    if (check) {
      return true
    }

    check = patternMatches(matcher.external.include, file)
    if (check) {
      return false
    }
  }
  catch (err) {
    ctx.sourceErrors.push(err as Error)
    return false
  }

  return source.inverted
}
