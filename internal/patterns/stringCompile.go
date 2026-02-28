package patterns

import (
	"strings"

	"github.com/bmatcuk/doublestar/v4"
)

type StringCompileOptions struct {
	// Disables case sensitivity.
	//
	// Default:
	//  false
	//
	// # Since 0.8.0
	NoCase bool
}

// Compiles a string of the {@link Pattern}.
//
// See [Pattern.Compile].
//
// # Since 0.8.0
func StringCompile(pattern string, context Pattern, options StringCompileCoptions) PatternMinimatch {
	if strings.HasSuffix(pattern, "/") {
		pattern += "**"
	}
	if strings.HasPrefix(pattern, "/") {
		pattern = pattern[1:]
	} else if !strings.HasPrefix(pattern, "**/") {
		pattern = "**/" + pattern
	}
	if !strings.HasSuffix(pattern, "/**") {
		pattern = pattern + "/**"
	}
	matched, err := doublestar.Match(pattern, path)
	return matched, err
}
