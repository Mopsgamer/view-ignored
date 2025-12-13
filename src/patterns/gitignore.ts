import type { Source, SourceExtractor } from './matcher.js'
import { minimatch } from 'minimatch'

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

    if (line.startsWith('!')) {
      source.pattern.include.push(line.substring(1))
    }
    else {
      source.pattern.exclude.push(line)
    }
  }
  // TODO: validate gitignore
}

extractGitignore satisfies SourceExtractor

export function gitignoreMatch(pattern: string, path: string): boolean {
  const o = { dot: true }
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
