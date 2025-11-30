package targets

import "path"

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
