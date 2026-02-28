package shared

/**
 * Used in {@link Ignores}.
 *
 * @since 0.6.0
 */
type IgnoresOptions struct {
	InitState
	// File or directory without the slash suffix.
	//
	// # Since 0.6.0
	Entry string
}

// Checks whether a given entry path should be ignored based on its patterns.
//
// See [ResolveSources].
// See [SignedPattern.Ignores].
// See https://github.com/Mopsgamer/view-ignored/tree/main/src/targets for usage examples.
//
// # Since 0.6.0
type Ignores = func(options IgnoresOptions) SignedPatternMatch
