import fsp from 'node:fs/promises'
import { ignores } from './matcher.js'

export type Pattern = {
  exclude: string[]
  include: string[]
}
export type Matcher = {
  external: Pattern
  internal: Pattern
}

export type Scanner = (path: string) => boolean
export type Source = {
  pattern: Pattern
  name: string
  inverted: boolean
}
export type SourceContent = { toString(): string }
export type SourceCache = {
  globs: Matcher
}
export type SourceError = {
  error: Error
}
export type SourceGetter = (dirPath: string) => SourceCache | SourceError | null
export type Target = {
  /**
   * Get the source content and directories for a given path.
   */
  getSource: SourceGetter
}

export type TargetContext = {
  paths: Set<string>
  external: Map<string, Source>
  sourceErrors: Error[]
  totalFiles: number
  totalMatchedFiles: number
  totalDirs: number
}
export type ScanResult = Map<Target, TargetContext>

export type ScanOptions = {
  targets: [Target, ...Target[]]
  cwd?: string
  invert?: false
  depth?: number
}

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const { targets, cwd = process.cwd(), depth = Infinity, invert = false } = options
  const dir = fsp.opendir(cwd, { recursive: true })
  const scanResult: ScanResult = new Map<Target, TargetContext>()

  for (const target of targets) {
    const result: TargetContext = {
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

      let ignored = ignores(path, isDir, result)
      if (result.sourceErrors.length > 0) {
        break
      }

      if (invert) {
        ignored = !ignored
      }

      if (isDir) {
        const count = walkCount(path, ignores, options, result)
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

function countSlashes(path: string): number {
  let count = 0
  for (let i = 0; i < path.length; i++) {
    if (path[i] === '/') count++
  }
  return count
}
