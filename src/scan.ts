import fsp from 'node:fs/promises'
import type { MatcherContext, Source, PathChecker } from './patterns/matcher.js'
import type { Target } from './targets/target.js'

export type ScanResult = Map<Target, MatcherContext>

export type ScanOptions = {
  targets: [Target, ...Target[]]
  cwd?: string
  invert?: false
  depth?: number
}

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const { targets, cwd = process.cwd(), depth = Infinity, invert = false } = options
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
      const path = `${entry.parentPath}/${entry.name}`
      const dpth = countSlashes(path)
      const isDir = entry.isDirectory()

      if (isDir) {
        result.totalDirs++
      }
      else {
        result.totalFiles++
      }

      let ignored = target.matcher(path, isDir, result)
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
          result.paths.add(`${path}/...+${count}`)
        }
        else if (!ignored) {
          if (dpth <= depth) {
            result.totalMatchedFiles++
            result.paths.add(path)
          }
        }
      }
    }
  }

  return scanResult
}

async function walkCount(path: string, ignores: PathChecker, options: ScanOptions, ctx: MatcherContext): Promise<number> {
	let count = 0
	const dir = fsp.opendir(path, { recursive: true })
	for await (const entry of await dir) {
      		const path = `${entry.parentPath}/${entry.name}`
		const isDir = entry.isDirectory()
	
		if (isDir) {
			ctx.totalDirs++
			continue
		}
		else {
			ctx.totalFiles++
		}

		let ignored = ignores(path, isDir, ctx)
		if (ctx.sourceErrors.length > 0) {
			break
		}

		if (options.invert) {
			ignored = !ignored
		}

		if (ignored) {
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

