import fsp from 'node:fs/promises'
import { posix } from 'node:path'
import type { MatcherContext, Source, PathChecker } from './patterns/matcher.js'
import type { Target } from './targets/target.js'

export type ScanResult = Map<Target, MatcherContext>

export type ScanOptions = {
  /**
   * Targets to scan for.
   */
  targets: [Target, ...Target[]]
  /**
   * Current working directory to start the scan from.
   */
  cwd?: string
  /**
   * If enabled, the scan will return files that are ignored by the target matchers.
   */
  invert?: boolean
  /**
   * Starting from depth `0` means you will see
   * children of the current working directory.
   */
  depth?: number
  /**
   * When `depth` is specified, directories
   * at the maximum depth that contain
   * matched dir.-paths will be represented as `dir/...+N`.
   */
  depthPaths?: 'files' | undefined
}

/**
 * Scan the directory for included files based on the provided targets.
 *
 * Note that this function uses `fs/promises.opendir` with recursive option,
 * and `fs/promises.readFile`. It also normalizes paths to use forward slashes..
 *
 * @param options Scan options.
 * @returns A promise that resolves to a map of targets to their matcher contexts.
 */
export async function scan(options: ScanOptions): Promise<ScanResult> {
  const {
    targets,
    cwd: cwdo = (await import('node:process')).cwd(),
    depth = Infinity,
    invert = false,
    depthPaths = false,
  } = options
  const cwd = cwdo.replaceAll('\\', '/')
  const dir = fsp.opendir(cwd, { recursive: true })
  const scanResult: ScanResult = new Map<Target, MatcherContext>()

  for (const target of targets) {
    const result: MatcherContext = {
      paths: new Set<string>(),
      external: new Map<string, Source>(),
      sourceErrors: [],
      totalFiles: 0,
      totalMatchedFiles: 0,
      totalDirs: 0,
    }
    scanResult.set(target, result)
    for await (const entry of await dir) {
      const path = posix.join(posix.relative(cwd, entry.parentPath.replaceAll('\\', '/')), entry.name)
      const dpth = countSlashes(path)
      const isDir = entry.isDirectory()

      if (isDir) {
        result.totalDirs++
      }
      else {
        result.totalFiles++
      }

      let ignored = await target.matcher(path, isDir, result)
      if (result.sourceErrors.length > 0) {
        break
      }

      if (invert) {
        ignored = !ignored
      }

      if (isDir) {
        const count = await walkCount(path, target.matcher, options, result)
        if (dpth === depth && count > 0) {
          result.totalMatchedFiles += count
          let p = path + '/'
          if (depthPaths === 'files') {
            p += '...+' + count
          }
          result.paths.add(p)
        }
      }
      else if (!ignored) {
        if (dpth <= depth) {
          result.totalMatchedFiles++
          result.paths.add(path)
        }
      }
    }
  }

  return scanResult
}

async function walkCount(path: string, ignores: PathChecker, options: ScanOptions, ctx: MatcherContext): Promise<number> {
  const { invert = false } = options
  let count = 0
  const dir = fsp.opendir(path, { recursive: true })
  for await (const entry of await dir) {
    const path = posix.join(posix.relative('.', entry.parentPath.replaceAll('\\', '/')), entry.name)
    const isDir = entry.isDirectory()

    if (isDir) {
      ctx.totalDirs++
      continue
    }
    else {
      ctx.totalFiles++
    }

    let ignored = await ignores(path, isDir, ctx)
    if (ctx.sourceErrors.length > 0) {
      break
    }

    if (invert) {
      ignored = !ignored
    }

    if (!ignored) {
      count++
    }
  }
  return count
}

function countSlashes(path: string): number {
  let count = 0
  for (let i = 0; i < path.length; i++) {
    if (path[i] === '/') count++
  }
  return count
}
