import fsp from 'node:fs/promises'
import { posix } from 'node:path'
import type { MatcherContext, Source } from './patterns/matcher.js'
import type { Target } from './targets/target.js'

export type DepthMode = 'files' | undefined

export type ScanOptions = {
  /**
   * Provides the matcher to use for scanning.
   */
  target: Target

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
   * Return as soon as possible.
   */
  signal?: AbortSignal
  /**
   * If enabled, Depth will be calculated faster by skipping
   * other files after first match.
   * This makes the scan faster but affects
   * {@link MatcherContext.totalDirs},
   * {@link MatcherContext.totalFiles},
   * {@link MatcherContext.totalMatchedFiles}
   * and {@link MatcherContext.depthPaths}.
   */
  fastDepth?: boolean
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
export async function scan(options: ScanOptions): Promise<MatcherContext> {
  const {
    target,
    cwd: cwdo = (await import('node:process')).cwd(),
    depth: maxDepth = Infinity,
    invert = false,
    signal = undefined,
    fastDepth = false,
  } = options
  const cwd = cwdo.replaceAll('\\', '/')
  const dir = fsp.opendir(cwd, { recursive: true })

  const ctx: MatcherContext = {
    paths: new Set<string>(),
    external: new Map<string, Source>(),
    depthPaths: new Map<string, number>(),
    sourceErrors: [],
    totalFiles: 0,
    totalMatchedFiles: 0,
    totalDirs: 0,
  }
  for await (const entry of await dir) {
    if (signal?.aborted) {
      return ctx
    }
    const path = posix.join(posix.relative(cwd, entry.parentPath.replaceAll('\\', '/')), entry.name)

    if (entry.isDirectory()) {
      ctx.totalDirs++
      // if (!fastDepth) {
      //   continue
      // }
      // const { depth } = getDepth(path, maxDepth)

      // if (depth <= maxDepth) {
      //   continue
      // }
      continue // TODO: (perf) skip dir
    }

    ctx.totalFiles++

    if (fastDepth) {
      const { depth, depthSlash } = getDepth(path, maxDepth)
      if (depth > maxDepth) {
        let ignored = await target.matcher(path, false, ctx)
        if (ctx.sourceErrors.length > 0) {
          break
        }

        if (invert) {
          ignored = !ignored
        }

        if (ignored) {
          continue
        }

        const dir = path.substring(0, depthSlash)
        ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
        continue // TODO: (perf) skip dir
      }
    }

    let ignored = await target.matcher(path, false, ctx)
    if (ctx.sourceErrors.length > 0) {
      break
    }

    if (invert) {
      ignored = !ignored
    }

    if (ignored) {
      continue
    }

    ctx.totalMatchedFiles++
    const { depth, depthSlash } = getDepth(path, maxDepth)
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
    ctx.paths.add(dir + '/')
  }

  console.log(ctx.paths)
  return ctx
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
