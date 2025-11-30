package targets

import (
	"fmt"
	"slices"
	"strings"
)

type Target string

func (t Target) String() string {
	return string(t)
}

var _ fmt.Stringer = (*Target)(nil)

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

type MatcherContext struct {
	Paths    []string
	External map[string]*Pattern // Ignore patterns for each dir
}

type Matcher = func(path string, isDir bool, ctx *MatcherContext) (bool, error)

func IgnoresFor(target Target) Matcher {
	matcher := IgnoreGit
	switch target {
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
