import { type SourceExtractor, type SignedPattern, signedPatternIgnores, findAndExtract } from '../patterns/matcher.js'
import { extractGitignore } from '../patterns/gitignore.js'
import type { Target } from './target.js'

const gitSources = ['.gitignore']
const gitSourceMap = new Map<string, SourceExtractor>([['.gitignore', extractGitignore]])
const gitPattern: SignedPattern = {
  exclude: [
    '.git',
    '.DS_Store',
  ],
  include: [],
}

export const Git: Target = {
  name: 'Git',
  targetName: 'git',
  check: 'git ls-tree -r HEAD --name-only',
  icon: '',
  color: '#f44e28',

  async matcher(entry, isDir, ctx) {
    if (isDir) {
      await findAndExtract(entry, gitSources, gitSourceMap, ctx)
      return true
    }
    return await signedPatternIgnores(gitPattern, entry, gitSources, gitSourceMap, ctx)
  },
}
