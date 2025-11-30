package targets

import (
	"path"
)

var IgnoreGit Matcher = func(entry string, isDir bool, ctx *MatcherContext) (bool, error) {
	internal := Pattern{
		exclude: []string{
			".git/**",
			".DS_Store/**",
		},
	}

	if !isDir {
		parent := path.Dir(entry)
		external, ok := ctx.External[parent]
		if !ok {
			FindAndProcessGitignore(entry, ctx)
			external = ctx.External[parent]
		}
		return Ignores(internal, *external, entry, false)
	}

	return FindAndProcessGitignore(entry, ctx)
}
