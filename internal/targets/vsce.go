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

	if isDir {
		FindAndExtract(entry, vsceFiles, map[string]SourceExtractor{".gitignore": ExtractGitignore}, ctx)
		return true
	}

	parent := path.Dir(entry)
	external, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(entry, vsceFiles, map[string]SourceExtractor{".gitignore": ExtractGitignore}, ctx)
		if len(ctx.SourceErrors) > 0 {
			return false
		}
		external = ctx.External[parent]
	}
	return Ignores(internal, external.Pattern, ctx, entry, external.Inverted)
}
