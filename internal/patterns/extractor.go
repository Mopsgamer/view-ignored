package patterns

import (
	"io/fs"
)

type ExtractorNext int

const (
	ExtractorContinue ExtractorNext = iota
	ExtractorBreak
)

// Populates the [Source] object from the content of a source file.
// Results are available in [MatcherContext.External].
// If [ExtractorContinue] returned, will skip the extractor.
//
// See [Source.Pattern] for more details.
//
// # Since 0.6.0
type ExtractorFn = func(source *Source, content []byte, ctx *MatcherContext) ExtractorNext

// Defines a method for extracting patterns from a specific source file.
//
// # Since 0.6.0
type Extractor struct {
	// Relative path.
	//
	// Example:
	//  ".gitignore".
	//
	// # Since 0.6.0
	Path string
	// Populates the source object from the content of a source file.
	//
	// See [ExtractorFn].
	//
	// # Since 0.6.0
	Extract ExtractorFn
}

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
	// The target implementation.
	//
	// # Since 0.6.0
	Extractors []Extractor
}
