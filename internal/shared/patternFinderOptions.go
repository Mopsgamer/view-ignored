package shared

import (
	"io/fs"
)

// Options for finding and extracting patterns from source files.
//
// See [ResolveSources].
// See [SignedPattern.Ignores].
//
// # Since 0.6.0
type PatternFinderOptions struct {
	// The file system adapter for directory walking and reading files.
	//
	// # Since 0.6.0
	FS fs.FS
	// The context to modify.
	//
	// # Since 0.6.0
	Ctx *MatcherContext
	// The current working directory.
	//
	// # Since 0.6.0
	Cwd string
	// The Target implementation.
	//
	// # Since 0.6.0
	Target Target
	// Initial search directory.
	// Relative to the `cwd` path or absolute path.
	//
	// # Since 0.6.0
	Root string
	// Return as soon as possible.
	//
	// # Since 0.7.1
	Signal chan struct{}
}
