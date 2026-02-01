package patterns

// Combined internal and external patterns for matching.
//
// See [SignedPattern.Ignores].
type PatternMatcher struct {
	Internal, External SignedPattern
}
