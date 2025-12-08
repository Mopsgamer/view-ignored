package targets

import (
	"fmt"
	"slices"
	"strings"
)

type Target string

var _ fmt.Stringer = (*Target)(nil)

func (t Target) String() string {
	return string(t)
}

func (t Target) Macher() Matcher {
	matcher := IgnoreGit
	switch t {
	case TargetGit:
		matcher = IgnoreGit
	case TargetNpm:
		matcher = IgnoreNpm
	case TargetVsce:
		matcher = IgnoreVsce
	case TargetYarn:
		matcher = IgnoreYarn
	case TargetJsr:
		matcher = IgnoreJsr
	}
	return matcher
}

const (
	TargetGit  Target = "git"
	TargetNpm  Target = "npm"
	TargetVsce Target = "vsce"
	TargetYarn Target = "yarn"
	TargetJsr  Target = "jsr"
)

var SupportedTargets = [...]Target{TargetGit, TargetNpm, TargetVsce, TargetYarn, TargetJsr}

func IsTarget(target *string) bool {
	return slices.Contains(SupportedTargets[:], Target(*target))
}

func SupportedTargetsList() string {
	result := [len(SupportedTargets)]string{}
	for i, t := range SupportedTargets {
		result[i] = t.String()
	}
	return strings.Join(result[:], ", ")
}

type Source struct {
	Pattern
	Name     string
	Inverted bool
}

type MatcherContext struct {
	Paths             []string
	External          map[string]Source // Ignore patterns for each dir
	SourceErrors      []error
	TotalFiles        int
	TotalMatchedFiles int
	TotalDirs         int
}

type Matcher = func(path string, isDir bool, ctx *MatcherContext) (ignores bool)
