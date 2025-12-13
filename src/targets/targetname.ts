import type { Target } from './target.js'
import { Git } from './git.js'
import { NPM } from './npm.js'
import { VSCE } from './vsce.js'
import { Yarn } from './yarn.js'
import { JSR } from './jsr.js'

export type TargetName = 'git' | 'npm' | 'vsce' | 'yarn' | 'jsr'

export function targetFromName(name: TargetName): Target {
  const map = {
    git: Git,
    npm: NPM,
    vsce: VSCE,
    yarn: Yarn,
    jsr: JSR,
  } as Record<TargetName, Target>
  return map[name]
}
