import fsp from 'node:fs/promises'
import { posix } from 'node:path'
import type { MatcherContext, Source } from './patterns/matcher.js'
import type { Target } from './targets/target.js'

export type ScanResult = Map<Target, MatcherContext>
export type DepthMode = 'files' | undefined

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
  depthPaths?: DepthMode

  /**
   * Return as soon as possible.
   */
  abortSignal?: AbortSignal
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
    depth: maxDepth = Infinity,
    invert = false,
    depthPaths,
    abortSignal,
  } = options
  const cwd = cwdo.replaceAll('\\', '/')
  const dir = fsp.opendir(cwd, { recursive: true })
  const scanResult: ScanResult = new Map<Target, MatcherContext>()

  for (const target of targets) {
    const ctx: MatcherContext = {
      paths: new Set<string>(),
      external: new Map<string, Source>(),
      depthPaths: new Map<string, number>(),
      sourceErrors: [],
      totalFiles: 0,
      totalMatchedFiles: 0,
      totalDirs: 0,
    }
    scanResult.set(target, ctx)
    for await (const entry of await dir) {
      if (abortSignal?.aborted) {
        return scanResult
      }
      const path = posix.join(posix.relative(cwd, entry.parentPath.replaceAll('\\', '/')), entry.name)
      const { depth, depthSlash } = getDepth(path, maxDepth)
      const isDir = entry.isDirectory()

      if (isDir) {
        ctx.totalDirs++
      }
      else {
        ctx.totalFiles++
      }

      let ignored = await target.matcher(path, isDir, ctx)
      if (ctx.sourceErrors.length > 0) {
        break
      }

      if (invert) {
        ignored = !ignored
      }

      if (isDir) {
        if (depth > maxDepth) {
          continue
        }
        continue
      }

      if (ignored) {
        continue
      }

      ctx.totalMatchedFiles++
      if (depth > maxDepth) {
        const dir = path.substring(0, depthSlash)
        ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
      }
      else {
        ctx.paths.add(path)
      }
    }

    for (const [dir, count] of ctx.depthPaths) {
      if (count === 0) {
        continue
      }
      ctx.paths.add(dirPath(dir, count, depthPaths))
    }
  }

  return scanResult
}

function dirPath(path: string, count: number, depthMode: DepthMode): string {
  let dirPath = path + '/'
  if (depthMode === 'files') {
    dirPath += '...+' + count
  }
  return dirPath
}

function getDepth(path: string, maxDepth: number) {
  const result = {
    depth: 0,
    depthSlash: 0,
  }
  result.depthSlash = -1
  if (maxDepth < 0) {
    return result
  }
  for (const [i, c] of Array.from(path).entries()) {
    if (c !== '/') {
      continue
    }
    result.depth++
    if (result.depth < maxDepth) {
      continue
    }
    result.depthSlash = i
    return result
  }
  return result
}
