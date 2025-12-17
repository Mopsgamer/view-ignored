package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

// Contains the matcher used for target scanning.
type Target struct {
	// Glob-pattern parser.
	Ignores patterns.Ignores
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
