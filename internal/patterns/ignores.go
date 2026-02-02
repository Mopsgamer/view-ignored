package patterns

import "io/fs"

// Checks whether a given entry path should be ignored based on its patterns.
// See [SourceBackwards].
// See [SignedPattern.Ignores].
// See https://github.com/Mopsgamer/view-ignored/tree/main/src/targets for usage examples.
type Ignores = func(
	fs fs.FS,
	cwd string,
	entry string,
	ctx *MatcherContext,
) (match SignedPatternMatch)
