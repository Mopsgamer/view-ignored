package targets

import (
	"path"

	"github.com/gookit/color"
)

var npmFiles = []string{"package.json", ".npmignore", ".gitignore"}

var Npm = Target{
	Name:       "NPM",
	TargetName: TargetNpm,
	Check:      "npm pack --dry-run",
	Icon:       "",
	Color:      color.Hex("#CA0404"),
	Matcher: func(entry string, isDir bool, ctx *TargetContext) bool {
		internal := Pattern{
			Exclude: []string{
				".git",
				".DS_Store",
				"node_modules",
				".*.swp",
				"._*",
				".DS_Store",
				".git",
				".gitignore",
				".hg",
				".npmignore",
				".npmrc",
				".lock-wscript",
				".svn",
				".wafpickle-*",
				"config.gypi",
				"CVS",
				"npm-debug.log",
			},
			Include: []string{
				"bin",
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

		if isDir {
			FindAndExtract(entry, npmFiles, m, ctx)
			return true
		}

		parent := path.Dir(entry)
		external, ok := ctx.External[parent]
		if !ok {
			FindAndExtract(parent, npmFiles, m, ctx)
			if len(ctx.SourceErrors) > 0 {
				return false
			}
			external, ok = ctx.External[parent]
		}
		if !ok {
			return false
		}

		return Ignores(internal, external.Pattern, ctx, entry, external.Inverted)
	},
}
