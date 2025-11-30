package targets

import (
	"path"
)

var gitFiles = []string{".gitignore"}

var IgnoreGit Matcher = func(entry string, isDir bool, ctx *MatcherContext) bool {
	internal := Pattern{
		Exclude: []string{
			".git/**",
			".DS_Store/**",
		},
	}

	if isDir {
		FindAndExtract(entry, gitFiles, map[string]SourceExtractor{".gitignore": ExtractGitignore}, ctx)
		return true
	}

	parent := path.Dir(entry)
	external, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(entry, gitFiles, map[string]SourceExtractor{".gitignore": ExtractGitignore}, ctx)
		if len(ctx.SourceErrors) > 0 {
			return false
		}
		external, ok = ctx.External[parent]
	}
	if !ok {
		return false
	}

	return Ignores(internal, external.Pattern, ctx, entry, external.Inverted)
}
