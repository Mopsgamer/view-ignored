package targets

import (
	"os"
	"path"
	"strings"
)

const dotgitignore = ".gitignore"

func FindAndProcessGitignore(entry string, ctx *MatcherContext) (bool, error) {
	for entry != "." {
		bytes, err := os.ReadFile(entry + dotgitignore)
		if err != nil && !os.IsNotExist(err) {
			return false, nil
		}

		if os.IsNotExist(err) {
			entry = path.Dir(entry)
			continue
		}

		// put gitignore into patterns
		in, ex := GitignorePatterns(string(bytes))
		ctx.External.exclude = append(ctx.External.exclude, ex...)
		ctx.External.include = append(ctx.External.include, in...)
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
func GitignoreMatch(pattern, path string) (bool, error) {
	return true, nil
}
