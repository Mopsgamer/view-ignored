package targets

import (
	"strings"

	"github.com/bmatcuk/doublestar/v4"
)

func ExtractGitignore(source *Source, content []byte) (err error) {
	for line := range strings.SplitSeq(string(content), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if idx := strings.Index(line, "#"); idx != -1 {
			line = line[:idx]
		}

		if strings.HasPrefix(line, "!") {
			source.Pattern.Include = append(source.Pattern.Include, line[1:])
		} else {
			source.Pattern.Exclude = append(source.Pattern.Exclude, line)
		}
	}
	return nil // TODO: validate gitignore
}

var _ SourceExtractor = (SourceExtractor)(ExtractGitignore)

// .gitignore implementation
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
