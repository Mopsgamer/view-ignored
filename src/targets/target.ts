import type { PathChecker } from '../patterns/matcher.js'

export type Target = {
  /**
   * Glob-pattern parser.
   */
  matcher: PathChecker
}
