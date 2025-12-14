import type { PathChecker } from '../patterns/matcher.js'

export interface Target {
  /**
   * Glob-pattern parser.
   */
  matcher: PathChecker
}
