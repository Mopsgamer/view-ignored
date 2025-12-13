import type { Source } from './matcher.js'
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

export function gitignoreMatch(pattern: string, path: string): boolean {
  return minimatch(path, pattern, { dot: true })
}
