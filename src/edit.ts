import { dirname } from "node:path";
import type { MatcherContext } from "./patterns/matcher.js";
import { scan, type ScanOptions } from "./scan.js";

/**
 * Returns `true` if the path is included.
 * If it is not ignored by the target,
 * adds it to the {@link MatcherContext.paths}
 * and updates statistics.
 */
export async function matcherContextAddPath(
  ctx: MatcherContext,
  entry: string,
  options: Pick<ScanOptions, "target" | "cwd">,
): Promise<boolean> {
  if (ctx.paths.has(entry)) {
    return true;
  }

  const { target, cwd = (await import("node:process")).cwd().replaceAll("\\", "/") } = options;

  {
    const parent = dirname(entry);
    if (!(parent === "." || ctx.paths.has(parent))) {
      await matcherContextAddPath(ctx, parent + "/", options);
    }
  }

  const isDir = entry.endsWith("/");
  if (isDir) {
    const ignored = await target.ignores(cwd, entry.substring(0, entry.length - 1), ctx);
    return !ignored;
  }
  const ignored = await target.ignores(cwd, entry, ctx);
  if (ignored) {
    return false;
  }
  ctx.paths.add(entry);
  ctx.totalFiles++;
  ctx.totalMatchedFiles++;
  return true;
}

/**
 * Removes a path from the {@link MatcherContext.paths} and updates statistics.
 * If you want to remove a source, use {@link matcherContextRefreshDir} instead.
 */
export async function matcherContextRemovePath(ctx: MatcherContext, entry: string): Promise<void> {
  const isDir = entry.endsWith("/");

  if (!isDir) {
    ctx.external.delete(dirname(entry));
    if (ctx.paths.delete(entry)) {
      ctx.totalFiles--;
      ctx.totalMatchedFiles--;
    }
    return;
  }

  // if directory
  ctx.external.delete(entry);
  if (ctx.paths.delete(entry)) {
    ctx.totalDirs--;
  }

  const parent = dirname(entry);
  const count = (ctx.depthPaths.get(parent) ?? 1) - 1;
  if (count > 0) {
    ctx.depthPaths.set(parent, count);
  }
  ctx.depthPaths.delete(entry);

  const a = [...ctx.paths];
  for (const path of a) {
    if (!path.startsWith(entry)) {
      continue;
    }

    const isDir = path.endsWith("/");
    if (!isDir) {
      if (!path.substring(entry.length).includes("/")) {
        // for own files
        ctx.totalFiles--;
        ctx.totalMatchedFiles--;
      }
      continue;
    }

    await matcherContextRemovePath(ctx, path);
  }
}

/**
 * Refreshes a directory path in the {@link MatcherContext.paths}.
 * Updates paths and statistics.
 */
export async function matcherContextRefreshDir(
  ctx: MatcherContext,
  dir: string,
  options: ScanOptions,
): Promise<void> {
  if (dir.endsWith("/")) {
    dir = dir.substring(0, dir.length - 1);
  }

  await matcherContextRemovePath(ctx, dir + "/");

  const { cwd: cwdo = (await import("node:process")).cwd().replaceAll("\\", "/") } = options;
  let cwd = cwdo + "/" + dir;
  if (dir === ".") {
    cwd = cwdo;
  }
  const subctx = await scan({ ...options, cwd });

  for (const path of subctx.paths) {
    let fullPath = dir + "/" + path;
    if (dir === ".") {
      fullPath = path;
    }
    ctx.paths.add(fullPath);
  }
  for (const [path, count] of subctx.depthPaths) {
    let fullPath = dir + "/" + path;
    if (dir === ".") {
      fullPath = path;
    }
    ctx.depthPaths.set(fullPath, count);
  }
  for (const [path, source] of subctx.external) {
    let fullPath = dir + "/" + path;
    if (dir === ".") {
      fullPath = path;
    }
    ctx.external.set(fullPath, source);
  }
  ctx.totalFiles += subctx.totalFiles;
  ctx.totalDirs += subctx.totalDirs;
  ctx.totalMatchedFiles += subctx.totalMatchedFiles;
  ctx.failed ||= subctx.failed;
}
