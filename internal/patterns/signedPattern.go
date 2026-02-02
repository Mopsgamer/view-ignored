package patterns

import (
	"path"
)

// Represents a set of include and exclude patterns.
// These patterns are positive minimatch patterns.
//
// See [PatternMatcher].
type SignedPattern struct {
	Include, Exclude Pattern
}

// See [SignedPattern.Ignores].
type SignedPatternIgnoresOptions struct {
	PatternFinderOptions
	Entry    string
	Internal SignedPattern
}

type MatchKind = int
type MatchKindGroup = int

const (
	MatchKindNone MatchKind = iota
	MatchKindNoMatch
	MatchKindInvalidInternalPattern
	MatchKindMissingSource
	MatchKindBrokenSource
	MatchKindInvalidPattern

	MatchKindGroupInternal MatchKindGroup = iota
	MatchKindGroupExternal
)

type SignedPatternMatchInvalid struct {
	kind    MatchKind
	ignored bool
}

var _ SignedPatternMatch = (*SignedPatternMatchInvalid)(nil)

func (p SignedPatternMatchInvalid) Kind() MatchKind {
	return p.kind
}
func (p SignedPatternMatchInvalid) Ignored() *bool {
	return &p.ignored
}

type SignedPatternMatchValid struct {
	kind    MatchKindGroup
	Negated bool
	Pattern string
	ignored bool
}

var _ SignedPatternMatch = (*SignedPatternMatchValid)(nil)

func (p SignedPatternMatchValid) Kind() MatchKindGroup {
	return p.kind
}
func (p SignedPatternMatchValid) Ignored() *bool {
	return &p.ignored
}

type SignedPatternMatch interface {
	Kind() int
	Ignored() *bool
}

func InvertSignedPatternMatch(match SignedPatternMatch, invert bool) {
	if invert {
		*match.Ignored() = !*match.Ignored()
	}
}

// Checks whether a given entry should be ignored based on internal and external patterns.
// Populates unknown sources using [SourcesBackwards].
//
// Algorithm:
//
// 1. Check internal exclude patterns. If matched, return true.
//
// 2. Check internal include patterns. If matched, return false.
//
// 3. Check external patterns:
//   - If not inverted:
//     a. Check external include patterns. If matched, return false.
//     b. Check external exclude patterns. If matched, return true.
//   - If inverted:
//     a. Check external exclude patterns. If matched, return true.
//     b. Check external include patterns. If matched, return false.
//
// 4. If no patterns matched, return true if external is inverted, else false.
func (ointernal SignedPattern) Ignores(
	options SignedPatternIgnoresOptions,
) SignedPatternMatch {
	parent := path.Dir(options.Entry)
	source, ok := options.Ctx.External[parent]
	if !ok {
		SourceBackwards(SourcesBackwardsOptions{
			PatternFinderOptions: options.PatternFinderOptions,
			Dir:                  parent,
		})

		if options.Ctx.Failed {
			return SignedPatternMatchInvalid{kind: MatchKindBrokenSource, ignored: false}
		}

		source = options.Ctx.External[parent]
	}

	internal := options.Internal

	check := ""
	var err error

	check, err = internal.Exclude.Matches(options.Entry)
	if err != nil {
		return SignedPatternMatchInvalid{MatchKindInvalidInternalPattern, false}
	}
	if check != "" {
		return SignedPatternMatchValid{MatchKindGroupInternal, true, check, true}
	}

	check, err = internal.Include.Matches(options.Entry)
	if err != nil {
		return SignedPatternMatchInvalid{MatchKindInvalidInternalPattern, false}
	}
	if check != "" {
		return SignedPatternMatchValid{MatchKindGroupInternal, false, check, false}
	}

	if source == nil {
		return SignedPatternMatchInvalid{MatchKindNoMatch, false}
	}

	external := source.Pattern

	if !source.Inverted {
		check, err = external.Include.Matches(options.Entry)
		if err != nil {
			goto Error
		}
		if check != "" {
			return SignedPatternMatchValid{MatchKindGroupExternal, true, check, false}
		}

		check, err = external.Exclude.Matches(options.Entry)
		if err != nil {
			goto Error
		}
		if check != "" {
			return SignedPatternMatchValid{MatchKindGroupExternal, false, check, true}
		}
	} else {
		check, err = external.Exclude.Matches(options.Entry)
		if err != nil {
			goto Error
		}
		if check != "" {
			return SignedPatternMatchValid{MatchKindGroupExternal, false, check, true}
		}

		check, err = external.Include.Matches(options.Entry)
		if err != nil {
			goto Error
		}
		if check != "" {
			return SignedPatternMatchValid{MatchKindGroupExternal, true, check, false}
		}
	}

	return SignedPatternMatchInvalid{MatchKindNoMatch, source.Inverted}

Error:
	source.Error = err
	options.Ctx.Failed = true
	return SignedPatternMatchInvalid{MatchKindInvalidInternalPattern, false}
}
