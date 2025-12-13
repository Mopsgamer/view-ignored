import { type SourceExtractor, type SignedPattern, signedPatternIgnores, findAndExtract } from '../patterns/matcher.js'
import { extractGitignore } from '../patterns/gitignore.js'
import { extractPackageJson } from '../patterns/packagejson.js'
import type { Target } from './target.js'

const npmSources = ['package.json', '.npmignore', '.gitignore']
const npmSourceMap = new Map<string, SourceExtractor>([
  ['package.json', extractPackageJson],
  ['.npmignore', extractGitignore],
  ['.gitignore', extractGitignore],
])
const npmPattern: SignedPattern = {
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
  ],
  include: [
    'bin',
    'package.json',
    'README*',
    'LICENSE*',
    'LICENCE*',
  ],
}

export const NPM: Target = {
  name: 'NPM',
  targetName: 'npm',
  check: 'npm pack --dry-run',
  icon: '',
  color: '#ca0404',

  async matcher(entry, isDir, ctx) {
    if (isDir) {
      await findAndExtract(entry, npmSources, npmSourceMap, ctx)
      return true
    }
    return await signedPatternIgnores(npmPattern, entry, npmSources, npmSourceMap, ctx)
  },
}
