package patterns

import (
	"strings"

	"github.com/Mopsgamer/view-ignored/internal/shared"
)

// Extracts and compiles patterns from the file.
//
// See [SignedPattern.Compile].
//
// # Since 0.6.0
func ExtractGitignore(source *shared.Source, content []byte, _ *shared.MatcherContext) shared.ExtractorNext {
	extractGitignore(source, content)
	for _, element := range source.Pattern {
		element.Compile(shared.StringCompileOptions{NoCase: true})
	}
	return shared.ExtractorBreak
}

var _ shared.ExtractorFn = (shared.ExtractorFn)(ExtractGitignore)

func extractGitignore(source *shared.Source, content []byte) {
	include := shared.SignedPattern{}
	exclude := shared.SignedPattern{Excludes: true}
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
