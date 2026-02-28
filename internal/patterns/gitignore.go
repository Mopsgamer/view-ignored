package patterns

import (
	"strings"
)

// Extracts and compiles patterns from the file.
//
// See [SignedPattern.Compile].
//
// # Since 0.6.0
func ExtractGitignore(source *Source, content []byte, _ *MatcherContext) ExtractorNext {
	extractGitignore(source, content)
	for element := range source.Pattern {
		element.Compile(StringCompileOptions{NoCase: true})
	}
	return ExtractorBreak
}

var _ ExtractorFn = (ExtractorFn)(ExtractGitignore)

func extractGitignore(source *Source, content []byte) {
	include := SignedPattern{}
	exclude := SignedPattern{Excludes: true}
	for line := range strings.SplitSeq(string(content), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if cdx := strings.Index(line, "#"); cdx >= 0 {
			line = line[:cdx]
		}

		source.PushNegatable(line, false, include, exclude)
	}
}
