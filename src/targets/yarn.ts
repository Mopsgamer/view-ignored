import { type SourceExtractor, type SignedPattern, signedPatternIgnores, findAndExtract } from '../patterns/matcher.js'
import { extractGitignore } from '../patterns/gitignore.js'
import { extractPackageJson } from '../patterns/packagejson.js'
import type { Target } from './target.js'

const yarnSources = ['package.json', '.yarnignore', '.npmignore', '.gitignore']
const yarnSourceMap = new Map<string, SourceExtractor>([
  ['package.json', extractPackageJson],
  ['.yarnignore', extractGitignore],
  ['.npmignore', extractGitignore],
  ['.gitignore', extractGitignore],
])
const yarnPattern: SignedPattern = {
  exclude: [
    '.git',
    '.DS_Store',
    'node_modules',
    '.*.swp',
    '._*',
    '.DS_Store',
    '.git',
    '.gitignore',
    '.hg',
    '.npmignore',
    '.npmrc',
    '.lock-wscript',
    '.svn',
    '.wafpickle-*',
    'config.gypi',
    'CVS',
    'npm-debug.log',
    '.yarnignore',
    '.yarnrc',
  ],
  include: [
    'bin',
    'package.json',
    'README*',
    'LICENSE*',
    'LICENCE*',
  ],
}

export const Yarn: Target = {
  name: 'Yarn',
  targetName: 'yarn',
  icon: '',
  check: '',
  color: '#2e2a65',

  async matcher(entry, isDir, ctx) {
    if (isDir) {
      await findAndExtract(entry, yarnSources, yarnSourceMap, ctx)
      return true
    }
    return await signedPatternIgnores(yarnPattern, entry, yarnSources, yarnSourceMap, ctx)
  },
}
