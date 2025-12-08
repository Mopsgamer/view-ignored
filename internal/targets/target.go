package targets

import "github.com/gookit/color"

type Target struct {
	Name       string
	TargetName TargetName
	Check      string
	Icon       string
	Color      color.RGBColor

	Matcher Matcher
}
