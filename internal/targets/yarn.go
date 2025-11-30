package targets

import "path"

var yarnFiles = []string{"package.json", ".yarnignore", ".npmignore", ".gitignore"}

var IgnoreYarn Matcher = func(entry string, isDir bool, ctx *MatcherContext) bool {
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
			".yarnignore",
			".yarnrc",
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
		".yarnignore":  ExtractGitignore,
		".npmignore":   ExtractGitignore,
		".gitignore":   ExtractGitignore,
	}

	if isDir {
		FindAndExtract(entry, yarnFiles, m, ctx)
		return true
	}

	parent := path.Dir(entry)
	external, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(entry, yarnFiles, m, ctx)
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
