package targets

var IgnoreYarn Matcher = func(entry string, isDir bool, ctx *MatcherContext) (bool, error) {
	internal := Pattern{
		exclude: []string{
			".git/**",
			".DS_Store/**",
		},
	}

	if !isDir {
		return Ignores(internal, *ctx.External, entry, false)
	}

	return FindAndProcessGitignore(entry, ctx)
}
