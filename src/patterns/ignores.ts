import type { MatcherContext } from "../patterns/matcherContext.js"
import type { SignedPatternMatch } from "../patterns/signedPattern.js"
import type { FsAdapter } from "../types.js"

/**
 * Checks whether a given entry path should be ignored based on its patterns.
 *
 * @see {@link resolveSources}
 * @see {@link signedPatternIgnores}
 * @see {@link https://github.com/Mopsgamer/view-ignored/tree/main/src/targets} for usage examples.
 *
 * @since 0.0.6
 */
export type Ignores = (
	fs: FsAdapter,
	cwd: string,
	entry: string,
	ctx: MatcherContext,
) => Promise<SignedPatternMatch>
