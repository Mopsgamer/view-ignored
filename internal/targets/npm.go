package targets

import "path"

var npmFiles = []string{"package.json", ".npmignore", ".gitignore"}

var IgnoreNpm Matcher = func(entry string, isDir bool, ctx *MatcherContext) bool {
	internal := Pattern{
		Exclude: []string{
			".git/**",
			".DS_Store/**",
			"node_modules/**",
			".*.swp",
			"._*",
			".DS_Store/**",
			".git/**",
			".gitignore",
			".hg/**",
			".npmignore",
			".npmrc",
			".lock-wscript",
			".svn/**",
			".wafpickle-*",
			"config.gypi",
			"CVS/**",
			"npm-debug.log",
		},
		Include: []string{
			"bin/**",
			"package.json",
			"README*",
			"LICENSE*",
			"LICENCE*",
		},
	}

	var m = map[string]SourceExtractor{
		"package.json": ExtractPackageJson,
		".npmignore":   ExtractGitignore,
		".gitignore":   ExtractGitignore,
	}

	// TODO: package.json, .npmignore. see other targets
	if isDir {
		FindAndExtract(entry, npmFiles, m, ctx)
		return true
	}

	parent := path.Dir(entry)
	external, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(entry, npmFiles, m, ctx)
		if len(ctx.SourceErrors) > 0 {
			return false
		}
		external = ctx.External[parent]
	}
	return Ignores(internal, external.Pattern, ctx, entry, external.Inverted)
}
