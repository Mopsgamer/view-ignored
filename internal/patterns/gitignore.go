package patterns

import (
	"strings"

	"github.com/bmatcuk/doublestar/v4"
)

func ExtractGitignore(source *Source, content []byte) Extraction {
	for line := range strings.SplitSeq(string(content), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if cdx := strings.Index(line, "#"); cdx >= 0 {
			line = line[:cdx]
		}

		source.PushNegatable(line)
	}
	// TODO: validate gitignore
	return ExtractionContinue
}

var _ SourceExtractor = (SourceExtractor)(ExtractGitignore)

func GitignoreMatch(pattern, path string) (bool, error) {
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
