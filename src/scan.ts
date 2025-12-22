import { posix } from "node:path";
import type { MatcherContext, Source } from "./patterns/matcher.js";
import type { Target } from "./targets/target.js";
import { opendir } from "./walk.js";
import type { FsPromises } from "./fsp.js";
import { getDepth } from "./getdepth.js";

export type DepthMode = "files" | undefined;

export type ScanOptions = {
  /**
   * Provides the matcher to use for scanning.
   */
  target: Target;

  /**
   * Current working directory to start the scan from.
   */
  cwd?: string;

  /**
   * If enabled, the scan will return files that are ignored by the target matcher.
   */
  invert?: boolean;

  /**
   * Starting from depth `0` means you will see
   * children of the current working directory.
   */
  depth?: number;

  /**
   * Return as soon as possible.
   */
  signal?: AbortSignal;
  /**
   * Requires depth >= 0.
   * If enabled, directories will be processed faster
   * by skipping files after first match.
   * This makes the scan faster but affects
   * {@link MatcherContext.totalDirs},
   * {@link MatcherContext.totalFiles},
   * {@link MatcherContext.totalMatchedFiles}
   * and {@link MatcherContext.depthPaths}.
   */
  fastDepth?: boolean;

  /**
   * Filesystem promises adapter.
   */
  fsp?: FsPromises;
};

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
export async function scan(options: ScanOptions): Promise<MatcherContext> {
  const {
    target,
    cwd = (await import("node:process")).cwd().replaceAll("\\", "/"),
    depth: maxDepth = Infinity,
    invert = false,
    signal = undefined,
    fastDepth = false,
    fsp = await import("node:fs/promises"),
  } = options;
  if (maxDepth < 0) {
    throw new TypeError("Depth must be a non-negative integer");
  }
  const ctx: MatcherContext = {
    paths: new Set<string>(),
    external: new Map<string, Source>(),
    failed: false,
    depthPaths: new Map<string, number>(),
    totalFiles: 0,
    totalMatchedFiles: 0,
    totalDirs: 0,
    fsp,
  };

  await opendir(fsp, cwd, async (entry) => {
    signal?.throwIfAborted();
    const path = posix.join(
      posix.relative(cwd, entry.parentPath.replaceAll("\\", "/")),
      entry.name,
    );

    const isDir = entry.isDirectory();
    if (isDir) {
      ctx.totalDirs++;
    } else {
      ctx.totalFiles++;
    }

    if (fastDepth) {
      const { depth, depthSlash } = getDepth(path, maxDepth);
      if (depth > maxDepth) {
        let ignored = await target.ignores(cwd, path, ctx);
        if (ctx.failed) {
          return 2;
        }

        if (invert) {
          ignored = !ignored;
        }

        if (ignored) {
          return 0;
        }

        if (isDir) {
          // ctx.totalMatchedDirs++;
          // ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
          return 0;
        }

        ctx.totalMatchedFiles++;
        const dir = path.substring(0, depthSlash);
        ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1);
        return 1;
      }
    }

    let ignored = await target.ignores(cwd, path, ctx);
    if (ctx.failed) {
      return 2;
    }

    if (invert) {
      ignored = !ignored;
    }

    if (ignored) {
      return 0;
    }

    if (isDir) {
      // ctx.totalMatchedDirs++;
      // ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
      const { depth } = getDepth(path, maxDepth);
      if (depth <= maxDepth) {
        ctx.paths.add(path + "/");
      }
      return 0;
    }

    ctx.totalMatchedFiles++;
    const { depth, depthSlash } = getDepth(path, maxDepth);
    if (depth > maxDepth) {
      const dir = path.substring(0, depthSlash);
      ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1);
    } else {
      ctx.paths.add(path);
    }

    return 0;
  });

  signal?.throwIfAborted();

  for (const [dir, count] of ctx.depthPaths) {
    if (count === 0) {
      continue;
    }
    ctx.paths.add(dir + "/");
  }

  return ctx;
}
