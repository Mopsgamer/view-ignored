package shared

import (
	"github.com/gookit/color"
)

// Contains the matcher used for scanning.
//
// # Since 0.6.0
type Target struct {
	// The set of extractors.
	// Required for context-patching APIs (ctx add/remove path).
	//
	// # Since 0.6.0
	Extractors []Extractor
	// Glob-pattern parser.
	//
	// See [Ignores].
	//
	// # Since 0.6.0
	Ignores Ignores
	// Initialization function.
	// Called by the scanner method.
	//
	// Example:
	//  scan({ target: { ...Git, init: undefined } })
	//
	// See [Init].
	//
	// # Since 0.8.0
	Init Init
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
