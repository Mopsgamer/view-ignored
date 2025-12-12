import { minimatch } from 'minimatch'

export function gitignoreMatch(pattern: string, path: string): boolean {
  return minimatch(path, pattern, { dot: true })
}
