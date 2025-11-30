package targets

import "path"

var IgnoreYarn Matcher = func(entry string, isDir bool, ctx *MatcherContext) (bool, error) {
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
			".yarnignore",
			".yarnrc",
		},
		include: []string{
			"bin/**",
			"package.json",
			"README*",
			"LICENSE*",
			"LICENCE*",
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
