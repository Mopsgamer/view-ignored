package shared

// Represents a source of patterns for matching paths.
//
// # Since 0.6.0
type Source struct {
	// Patterns defined within the source file.
	// Those patterns are for ignoring files.
	//
	// # Since 0.6.0
	Pattern []SignedPattern

	// Name of the source file.
	//
	// # Since 0.6.0
	Name string

	// Relative path to the source file.
	//
	// # Since 0.6.0
	Path string

	// Indicates if the matching logic is inverted.
	// For example, `package.json` `files` field inverts the matching logic,
	// because it specifies files to include rather than exclude.
	//
	// # Since 0.6.0
	Inverted bool

	// Error encountered during extraction, if any.
	//
	// See [SourceExtractor].
	//
	// # Since 0.6.0
	Error error
}

// Adds a negatable pattern to the source's pattern lists.
// Strips the leading '!' for include patterns,
// and adds to exclude patterns otherwise.
//
// # Since 0.6.0
func (source *Source) PushNegatable(
	pattern string,
	invert bool,
	include, exclude SignedPattern,
) {
	if invert {
		exclude, include = include, exclude
	}

	dist := exclude

	if len(pattern) > 0 && pattern[0] == '!' {
		dist = include
		pattern = pattern[1:]
	}

	dist.Pattern = append(dist.Pattern, pattern)
}
