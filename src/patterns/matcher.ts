import * as fsp from 'node:fs/promises'
import { dirname } from 'node:path'
import { gitignoreMatch } from './gitignore.js'

export type MatcherContext = {
  paths: Set<string>
  external: Map<string, Source>
  sourceErrors: Error[]
  totalFiles: number
  totalMatchedFiles: number
  totalDirs: number
}

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

export type SignedPattern = {
  include: Pattern
  exclude: Pattern
}

export type PatternMatcher = {
  internal: SignedPattern
  external: SignedPattern
}

export type PathChecker = (path: string, isDir: boolean, ctx: MatcherContext) => boolean

export type Source = {
  pattern: SignedPattern
  name: string
  inverted: boolean
}

export type SourceExtractor = (source: Source, content: Buffer<ArrayBuffer>) => void

export async function findAndExtract(directory: string, sources: string[], matcher: Map<string, SourceExtractor>, ctx: MatcherContext): Promise<void> {
  const keys: string[] = []
  ctx.sourceErrors = []
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
        return
      }

      if (!buff) {
        directory = dir
        continue
      }

      const sourceExtractor = matcher.get(sourceFileName)!
      if (!sourceExtractor) {
        throw new Error('No extractor for source file: ' + sourceFileName)
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
      }
      for (const key of keys) {
        const m = ctx.external.get(key)
        if (!m) {
          ctx.external.set(key, source)
        }
      }
      keys.length = 0
      directory = dir
    }
  }
}

export function signedPatternIgnores(internal: SignedPattern, file: string, sources: string[], sourceMap: Map<string, SourceExtractor>, ctx: MatcherContext): boolean {
  const parent = dirname(file)
  let source = ctx.external.get(parent)
  if (!source) {
    findAndExtract(parent, sources, sourceMap, ctx)
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

  let check = false

  try {
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
