package targets

import "path"

var IgnoreNpm Matcher = func(entry string, isDir bool, ctx *MatcherContext) (bool, error) {
	internal := Pattern{
		exclude: []string{
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
		include: []string{
			"bin/**",
			"package.json",
			"README*",
			"LICENSE*",
			"LICENCE*",
		},
	}

	// TODO: package.json, .npmignore. see other targets
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
