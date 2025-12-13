import { type SourceExtractor, type SignedPattern, signedPatternIgnores, findAndExtract } from '../patterns/matcher.js'
import { extractGitignore } from '../patterns/gitignore.js'
import { extractPackageJson } from '../patterns/packagejson.js'
import type { Target } from './target.js'

const vsceSources = ['package.json', '.vscodeignore']
const vsceSourceMap = new Map<string, SourceExtractor>([
  ['package.json', extractPackageJson],
  ['.vscodeignore', extractGitignore],
])
const vscePattern: SignedPattern = {
  exclude: [
    '.git',
    '.DS_Store',
  ],
  include: [],
}

export const VSCE: Target = {
  name: 'VSCE',
  targetName: 'vsce',
  check: 'vsce ls',
  icon: '󰨞',
  color: '#23a9f1',

  matcher(entry, isDir, ctx) {
    if (isDir) {
      findAndExtract(entry, vsceSources, vsceSourceMap, ctx)
      return true
    }
    return signedPatternIgnores(vscePattern, entry, vsceSources, vsceSourceMap, ctx)
  },
}
