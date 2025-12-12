import type { PathChecker } from '../patterns/matcher.js'
import type { TargetName } from './targetname.js'

export type Target = {
	name: string
	targetName: TargetName
	check: string
	icon: string
	color: string

	matcher: PathChecker
}
