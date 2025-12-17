package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var npmSources = []string{"package.json", ".npmignore", ".gitignore"}
var npmSourceMap = map[string]patterns.SourceExtractor{
	"package.json": patterns.ExtractPackageJson,
	".npmignore":   patterns.ExtractGitignore,
	".gitignore":   patterns.ExtractGitignore,
}
var npmPattern = patterns.SignedPattern{
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

var Npm = PrintableTarget{
	Name:       "NPM",
	TargetName: TargetNpm,
	Check:      "npm pack --dry-run",
	Icon:       "",
	Color:      color.Hex("#CA0404"),
	Target: Target{
		Ignores: func(cwd, entry string, ctx *patterns.MatcherContext) bool {
			return npmPattern.Ignores(cwd, entry, npmSources, npmSourceMap, ctx)
		},
	},
}
