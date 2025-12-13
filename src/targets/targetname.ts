import type { Target } from './target.js'
import { Git } from './git.js'
import { Npm } from './npm.js'
import { Vsce } from './vsce.js'
import { Yarn } from './yarn.js'
import { Jsr } from './jsr.js'

export type TargetName = 'git' | 'npm' | 'vsce' | 'yarn' | 'jsr'

export function targetFromName(name: TargetName): Target {
	const map = {
		'git': Git,
		'npm': Npm,
		'vsce': Vsce,
		'yarn': Yarn,
		'jsr': Jsr,
	} as Record<TargetName, Target>
	return map[name]
}

