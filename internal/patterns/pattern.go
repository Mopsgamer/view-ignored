package patterns

// Compiled pattern.
//
// See [StringCompile].
// See [SignedPattern.Compile].
//
// # Since 0.6.0
type PatternMinimatch struct {
	// The regular expression instance.
	//
	// # Since 0.6.0
	Re func(path string) (bool, error)
	// The original pattern string this minimatch was compiled from.
	//
	// # Since 0.6.0
	pattern string
	// The original pattern list this pattern was compiled from.
	//
	// # Since 0.6.0
	patternContext Pattern
}

func (pm PatternMinimatch) Test(path string) (bool, error) {
	return pm.Re(path)
}

// Represents a list of positive minimatch patterns.
type Pattern []string

func (pattern Pattern) Compile(options StringCompileOptions) []PatternMinimatch {
	values := []PatternMinimatch{}
	for _, p := range pattern {
		values = append(values, StringCompile(p, pattern, options))
	}
	return values
}
