import { type SourceExtractor, type SignedPattern, signedPatternIgnores, findAndExtract } from '../patterns/matcher.js'
import { extractJsrJson, extractJsrJsonc } from '../patterns/jsrjson.js'
import type { Target } from './target.js'

const jsrSources = ['deno.json', 'deno.jsonc', 'jsr.json', 'jsr.jsonc']
const jsrSourceMap = new Map<string, SourceExtractor>([
  ['deno.json', extractJsrJson],
  ['deno.jsonc', extractJsrJsonc],
  ['jsr.json', extractJsrJson],
  ['jsr.jsonc', extractJsrJsonc],
])
const vscePattern: SignedPattern = {
  exclude: [
    '.git',
    '.DS_Store',
  ],
  include: [],
}

export const JSR: Target = {
  name: 'JSR',
  targetName: 'jsr',
  check: '',
  icon: '',
  color: '#f5dd1e',

  async matcher(entry, isDir, ctx) {
    if (isDir) {
      await findAndExtract(entry, jsrSources, jsrSourceMap, ctx)
      return true
    }
    return await signedPatternIgnores(vscePattern, entry, jsrSources, jsrSourceMap, ctx)
  },
}
