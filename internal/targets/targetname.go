package targets

import (
	"fmt"
	"slices"
	"strings"
)

type TargetName string

var _ fmt.Stringer = (*TargetName)(nil)

func (t TargetName) String() string {
	return string(t)
}

func (t TargetName) Target() Target {
	var matcher Target
	switch t {
	case TargetGit:
		matcher = Git
	case TargetNpm:
		matcher = Npm
	case TargetVsce:
		matcher = Vsce
	case TargetYarn:
		matcher = Yarn
	case TargetJsr:
		matcher = Jsr
	}
	return matcher
}

const (
	TargetGit  TargetName = "git"
	TargetNpm  TargetName = "npm"
	TargetVsce TargetName = "vsce"
	TargetYarn TargetName = "yarn"
	TargetJsr  TargetName = "jsr"
)

var SupportedTargets = [...]TargetName{TargetGit, TargetNpm, TargetVsce, TargetYarn, TargetJsr}

func IsTarget(target *string) bool {
	return slices.Contains(SupportedTargets[:], TargetName(*target))
}

func SupportedTargetsList() string {
	result := [len(SupportedTargets)]string{}
	for i, t := range SupportedTargets {
		result[i] = t.Target().Color.Sprint(t.String())
	}
	return strings.Join(result[:], ", ")
}

type Source struct {
	Pattern
	Name     string
	Inverted bool
}
