import type { FsAdapter } from "../types.js"
import type { MatcherContext } from "../patterns/matcherContext.js"
import type { SignedPatternMatch } from "../patterns/signedPattern.js"

/**
 * Checks whether a given entry path should be ignored based on its patterns.
 * @see {@link resolveSources}
 * @see {@link signedPatternIgnores}
 * @see {@link https://github.com/Mopsgamer/view-ignored/tree/main/src/targets} for usage examples.
 */
export type Ignores = (
	fs: FsAdapter,
	cwd: string,
	entry: string,
	ctx: MatcherContext,
) => Promise<SignedPatternMatch>
