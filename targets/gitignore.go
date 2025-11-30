package targets

import (
	"os"
	"path"
	"strings"

	"github.com/bmatcuk/doublestar/v4"
)

const dotgitignore = ".gitignore"

func FindAndProcessGitignore(entry string, ctx *MatcherContext) (bool, error) {
	keys := []string{}
	looped := false
	for entry != "." || !looped {
		looped = entry == "."
		bytes, err := os.ReadFile(entry + "/" + dotgitignore)
		if err != nil && !os.IsNotExist(err) {
			return false, nil
		}

		dir := path.Dir(entry)
		keys = append(keys, dir)
		if os.IsNotExist(err) {
			entry = dir
			continue
		}

		// put gitignore into patterns
		in, ex := GitignorePatterns(string(bytes))
		for _, key := range keys {
			m, ok := ctx.External[key]
			if !ok {
				m = &Pattern{}
				ctx.External[key] = m
			}
			m.exclude = append(m.exclude, ex...)
			m.include = append(m.include, in...)
		}
		break
	}

	return true, nil
}

func GitignorePatterns(content string) (include, exclude []string) {
	for line := range strings.SplitSeq(content, "\n") {
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
	return include, exclude
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
