import { gitignoreMatch } from './gitignore.js'
import type { Matcher, TargetContext } from './scan.js'

function matchAny(patterns: string[], path: string): boolean {
  for (const pattern of patterns) {
    const matched = gitignoreMatch(pattern, path)
    if (matched) {
      return true
    }
  }
  return false
}

export function ignores(matcher: Matcher, ctx: TargetContext, name: string, def: boolean): boolean {
  let check = false

  try {
    check = matchAny(matcher.internal.exclude, name)
    if (check) {
      return true
    }

    check = matchAny(matcher.internal.include, name)
    if (check) {
      return false
    }

    check = matchAny(matcher.external.exclude, name)
    if (check) {
      return true
    }

    check = matchAny(matcher.external.include, name)
    if (check) {
      return false
    }
  }
  catch (err) {
    ctx.sourceErrors.push(err as Error)
    return false
  }

  return def
}
