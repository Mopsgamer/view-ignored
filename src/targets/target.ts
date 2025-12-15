import type { PathChecker } from '../patterns/matcher.js'

/**
 * Contains the matcher used for target scanning.
 */
export interface Target {
  /**
   * Glob-pattern parser.
   */
  matcher: PathChecker
}
