package patterns

import (
	"io/fs"
)

// Populates a `Source` object from the content of a source file.
//
// See [Source.Pattern] for more details.
type ExtractorFn = func(source *Source, content []byte, ctx *MatcherContext)

// Defines a method for extracting patterns from a specific source file.
type Extractor struct {
	Path    string
	Extract ExtractorFn
}

// Options for finding and extracting patterns from source files.
//
// See [SourceBackwards].
// See [SignedPattern.Ignores].
type PatternFinderOptions struct {
	FS         fs.FS
	Ctx        *MatcherContext
	Cwd        string
	Extractors []Extractor
}
