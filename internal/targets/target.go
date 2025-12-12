package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

type Target struct {
	Name       string
	TargetName TargetName
	Check      string
	Icon       string
	Color      color.RGBColor

	Matcher patterns.PathChecker
}
