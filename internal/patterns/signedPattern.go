package patterns

import "path"

// Represents a set of include and exclude patterns.
// These patterns are positive minimatch patterns.
//
// [PatternMatcher] uses it.
// [SignedPattern.Ignores] provides the ignoring algorithm.
// [SignedPattern.Compile] compiles the signed pattern.
// Use this or an extractor's method to compile.
//
// # Since 0.6.0
type SignedPattern struct {
	// Provides ignored or included file and directory patterns.
	//
	// [SignedPattern.Ignores] provides the ignoring algorithm.
	//
	// # Since 0.9.0
	Pattern Pattern
	// If `true`, pattern "test" will exclude file named "test".
	//
	// [SignedPattern.Ignores] provides the ignoring algorithm.
	//
	// # Since 0.9.0
	Excludes bool
	// Provides compiled ignored or included file and directory patterns.
	//
	// [SignedPattern.Ignores] provides the ignoring algorithm.
	//
	// # Since 0.6.0
	Compiled []PatternMinimatch
}

// Compiles the {@link SignedPattern} (forced).
// Can be compiled at any time.
// Extractors are compiling it.
//
// See [Pattern.Compile].
//
// # Since 0.6.0
func (signedPattern SignedPattern) Compile(
	options StringCompileOptions,
) SignedPattern {
	signedPattern.Compiled = signedPattern.Pattern.Compile(options)
	return signedPattern
}

type MatchKind = int

const (
	MatchKindNone MatchKind = iota
	MatchKindMissingSource

	MatchKindNoMatch
	MatchKindBrokenSource
	MatchKindInvalidPattern

	MatchKindInvalidInternalPattern

	MatchKindInternal

	MatchKindExternal
)

// "none" | "missing-source"

type SignedPatternMatch_ struct {
	Kind    MatchKind
	Ignored bool
}

var _ SignedPatternMatch = (*SignedPatternMatch_)(nil)

func (p SignedPatternMatch_) GetKind() MatchKind {
	return p.Kind
}
func (p SignedPatternMatch_) GetIgnored() *bool {
	return &p.Ignored
}

// "no-match" | "broken-source" | "invalid-pattern"

type SignedPatternMatch_Source struct {
	SignedPatternMatch_
	Source Source
}

var _ SignedPatternMatch = (*SignedPatternMatch_Source)(nil)

// "invalid-internal-pattern"

type SignedPatternMatch_PatternError struct {
	SignedPatternMatch_Pattern
	Error error
}

var _ SignedPatternMatch = (*SignedPatternMatch_PatternError)(nil)

// "internal"

type SignedPatternMatch_Pattern struct {
	SignedPatternMatch_
	Pattern string
}

var _ SignedPatternMatch = (*SignedPatternMatch_Pattern)(nil)

// "external"

type SignedPatternMatch_PatternSource struct {
	SignedPatternMatch_
	Pattern string
	Source  Source
}

var _ SignedPatternMatch = (*SignedPatternMatch_PatternSource)(nil)

// See [SignedPattern.Ignores].
//
// # Since 0.6.0
type SignedPatternMatch interface {
	GetKind() int
	GetIgnored() *bool
}

// See [SignedPattern.Ignores].
//
// # Since 0.6.0
type SignedPatternIgnoresOptions struct {
	PatternFinderOptions
	Entry    string
	Internal SignedPattern
}

func patternRegExpTest(path string, rs []PatternMinimatch) (string, error) {
	for _, r := range rs {
		ok, err := r.Test(path)
		if ok {
			return r.pattern, err
		}
	}
	return "", nil
}

func InvertSignedPatternMatch(match SignedPatternMatch, invert bool) {
	if invert {
		*match.GetIgnored() = !*match.GetIgnored()
	}
}

func signedPatternCompileMatchInternal(
	options SignedPatternIgnoresOptions,
	path string,
) SignedPatternMatch {
	for _, si := range options.internal {
		const compiled = si.Compiled
		if compiled == nil {
			continue
		}

		patternMatch, errp := patternRegExpTest(path, compiled)
		if errp != nil {
			return SignedPatternMatch_PatternError{
				SignedPatternMatch_Pattern: SignedPatternMatch_Pattern{
					SignedPatternMatch_: SignedPatternMatch_{
						Kind:    MatchKindInvalidInternalPattern,
						Ignored: false,
					},
					Pattern: patternMatch,
				},
				Error: errp,
			}
		}
		if len(patternMatch) > 0 {
			return SignedPatternMatch_Pattern{
				SignedPatternMatch_: SignedPatternMatch_{
					Kind:    MatchKindInternal,
					Ignored: si.excludes,
				},
				Pattern: patternMatch,
			}
		}
	}
	return nil
}

// Checks whether a given entry should be ignored based on internal and external patterns.
// Populates unknown sources using [ResolveSources].
//
// # Since 0.6.0
func (ointernal SignedPattern) Ignores(
	options SignedPatternIgnoresOptions,
) SignedPatternMatch {
	parent := path.Dir(options.Entry)
	source := options.Ctx.External[parent]

	if source == nil {
		resolveSources(ResolveSourceOptions{options, dir: parent, root: options.root})
		source = options.Ctx.External[parent]
	}

	if source == nil || source == ExtractorContinue {
		return SignedPatternMatch_{
			Kind:    MatchKindMissingSource,
			Ignored: false,
		}
	}

	if source != nil && source.Error != nil {
		return SignedPatternMatch_Source{
			SignedPatternMatch_: SignedPatternMatch_{
				Kind:    MatchKindBrokenSource,
				Ignored: true,
			},
			Source: *source,
		}
	}

	internalMatch := signedPatternCompiledMatchInternal(options, options.Entry)
	if internalMatch != nil {
		return internalMatch
	}

	const externalMatch = signedPatternCompiledMatchExternal(options, options.Entry, source)
	return externalMatch
}
