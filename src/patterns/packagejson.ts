import { type } from 'arktype'
import {
  sourcePushNegatable,
  type Source,
  type SourceExtractor,
} from './matcher.js'

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

  for (const pattern of dist.files) {
    sourcePushNegatable(source, pattern)
  }

  return
}

extractPackageJson satisfies SourceExtractor
