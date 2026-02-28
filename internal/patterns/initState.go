package patterns

import "io/fs"

// Used in [IgnoresOptions].
//
// # Since 0.8.0
type InitState struct {
	// The file system adapter for directory walking and reading files.
	//
	// # Since 0.6.0
	FS fs.FS
	// # Since 0.6.0
	Cwd string
	// The context to populate.
	//
	// # Since 0.6.0
	Ctx MatcherContext
	// Return as soon as possible.
	//
	// # Since 0.7.1
	Signal chan struct{}
}
