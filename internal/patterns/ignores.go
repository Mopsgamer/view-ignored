package patterns

// Checks whether a given entry path should be ignored based on its patterns.
// See [SourceBackwards].
// See [SignedPattern.Ignores].
// See https://github.com/Mopsgamer/view-ignored/tree/main/src/targets for usage examples.
type Ignores = func(
	cwd string,
	entry string,
	ctx *MatcherContext,
) (match SignedPatternMatch)
