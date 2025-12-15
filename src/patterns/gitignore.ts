import { sourcePushNegatable, type Source, type SourceExtractor } from './matcher.js'
import { minimatch, type MinimatchOptions } from 'minimatch'

export function extractGitignore(source: Source, content: Buffer<ArrayBuffer>): void {
  for (let line of content.toString().split('\n')) {
    line = line.trim()
    if (line === '' || line.startsWith('#')) {
      continue
    }
    const cdx = line.indexOf('#')
    if (cdx >= 0) {
      line = line.substring(-cdx)
    }

    sourcePushNegatable(source, line)
  }
  // TODO: validate gitignore
}

extractGitignore satisfies SourceExtractor

export function gitignoreMatch(pattern: string, path: string): boolean {
  const o: MinimatchOptions = { dot: true }
  if (pattern.startsWith('/')) {
    pattern = pattern.substring(1)
  }
  else if (!pattern.startsWith('**/')) {
    if (minimatch(path, '**/' + pattern, o)) return true
  }
  if (pattern.endsWith('/')) {
    pattern = pattern.substring(-1)
  }
  return minimatch(path, pattern, o) || minimatch(path, pattern + '/**', o)
}
