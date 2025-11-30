package targets

import (
	"strings"

	"github.com/bmatcuk/doublestar/v4"
)

var ExtractGitignore SourceExtractor = func(source string, content []byte) (include, exclude []string, def bool, err error) {
	for line := range strings.SplitSeq(string(content), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if idx := strings.Index(line, "#"); idx != -1 {
			line = line[:idx]
		}

		if strings.HasPrefix(line, "!") {
			include = append(include, line[1:])
		} else {
			exclude = append(exclude, line)
		}
	}
	return include, exclude, false, nil // TODO: validate gitignore
}

// .gitignore implementation
func GitignoreMatch(pattern, name string) (bool, error) {
	if strings.HasPrefix(pattern, "/") {
		pattern = pattern[1:]
	} else if !strings.HasPrefix(pattern, "**/") {
		pattern = "**/" + pattern
	}
	if !strings.HasSuffix(pattern, "/**") {
		pattern = pattern + "/**"
	}
	matched, err := doublestar.Match(pattern, name)
	return matched, err
}
