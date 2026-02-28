package targets

import (
	"fmt"
	"slices"
	"strings"

	"github.com/Mopsgamer/view-ignored/internal/shared"
)

type TargetName string

var _ fmt.Stringer = (*TargetName)(nil)

func (t TargetName) String() string {
	return string(t)
}

func (t TargetName) Target() shared.PrintableTarget {
	var matcher shared.PrintableTarget
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

func IsTarget[T ~string](target *T) bool {
	return slices.Contains(SupportedTargets[:], TargetName((string)(*target)))
}

func SupportedTargetsList() string {
	result := [len(SupportedTargets)]string{}
	for i, t := range SupportedTargets {
		result[i] = t.Target().Color.Sprint(t.String())
	}
	return strings.Join(result[:], ", ")
}
