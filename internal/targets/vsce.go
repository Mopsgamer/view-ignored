package targets

import "path"

var vsceFiles = []string{"package.json", ".vscodeignore"}

var IgnoreVsce Matcher = func(entry string, isDir bool, ctx *MatcherContext) bool {
	internal := Pattern{
		Exclude: []string{
			".git/**",
			".DS_Store/**",
		},
	}

	m := map[string]SourceExtractor{
		"package.json":  ExtractPackageJson,
		".vscodeignore": ExtractGitignore,
	}

	if isDir {
		FindAndExtract(entry, vsceFiles, m, ctx)
		return true
	}

	parent := path.Dir(entry)
	external, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(entry, vsceFiles, m, ctx)
		if len(ctx.SourceErrors) > 0 {
			return false
		}
		external = ctx.External[parent]
	}
	return Ignores(internal, external.Pattern, ctx, entry, external.Inverted)
}
