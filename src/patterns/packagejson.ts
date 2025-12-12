import { type } from 'arktype'
import type { Source, SourceExtractor } from './matcher.js'

const nodeJsManifest = type({
  files: 'string[]?',
})

const parse = nodeJsManifest.pipe((s: string): typeof nodeJsManifest.infer => JSON.parse(s))

export function extractPackageJson(source: Source, content: Buffer<ArrayBuffer>): type.errors | undefined {
  source.inverted = true
  const dist = parse(content.toString())
  if (dist instanceof type.errors) {
    return dist
  }

  if (!dist.files) {
    return
  }

  for (const p of dist.files) {
    if (p.startsWith('!')) {
      source.pattern.exclude.push(...p.substring(1))
    }
    else {
      source.pattern.include.push(...p)
    }
  }

  return
}

extractPackageJson satisfies SourceExtractor
