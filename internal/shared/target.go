package shared

import (
	"github.com/gookit/color"
)

// Contains the matcher used for target scanning.
type Target struct {
	// Glob-pattern parser.
	Ignores Ignores
}

// Represents a specific target with additional information.
type PrintableTarget struct {
	Target

	Name       string
	TargetName TargetName
	Check      string
	Icon       string
	Color      color.RGBColor
}
