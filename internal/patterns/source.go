package patterns

// Represents a source of patterns for matching paths.
type Source struct {
	// Patterns defined within the source file.
	// Those patterns are for ignoring files.
	Pattern SignedPattern

	// Name of the source file.
	Name string

	// Relative path to the source file.
	Path string

	// Indicates if the matching logic is inverted.
	// For example, `package.json` `files` field inverts the matching logic,
	// because it specifies files to include rather than exclude.
	Inverted bool

	// Error encountered during extraction, if any.
	//
	// See [SourceExtractor].
	Error error
}

// Adds a negatable pattern to the source's pattern lists.
// Strips the leading '!' for include patterns,
// and adds to exclude patterns otherwise.
func (source *Source) PushNegatable(pattern string) {
	if len(pattern) > 0 && pattern[0] == '!' {
		source.Pattern.Include = append(source.Pattern.Include, pattern[1:])
	}
	source.Pattern.Exclude = append(source.Pattern.Exclude, pattern)
}
