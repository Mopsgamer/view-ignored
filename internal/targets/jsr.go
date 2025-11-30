package targets

import "path"

var IgnoreJsr Matcher = func(entry string, isDir bool, ctx *MatcherContext) bool {
	internal := Pattern{
		Exclude: []string{
			".git/**",
			".DS_Store/**",
		},
	}

	if isDir {
		FindAndExtract(entry, gitFiles, ExtractGitignore, ctx)
		return true
	}

	parent := path.Dir(entry)
	external, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(entry, gitFiles, ExtractGitignore, ctx)
		if len(ctx.SourceErrors) > 0 {
			return false
		}
		external = ctx.External[parent]
	}
	return Ignores(internal, *external, ctx, entry, false)
}
