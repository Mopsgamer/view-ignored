package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var yarnSources = []string{"package.json", ".yarnignore", ".npmignore", ".gitignore"}
var yarnSourceMap = map[string]patterns.SourceExtractor{
	"package.json": patterns.ExtractPackageJson,
	".yarnignore":  patterns.ExtractGitignore,
	".npmignore":   patterns.ExtractGitignore,
	".gitignore":   patterns.ExtractGitignore,
}
var yarnPattern = patterns.SignedPattern{
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
		".yarnignore",
		".yarnrc",
	},
	Include: []string{
		"bin",
		"package.json",
		"README*",
		"LICENSE*",
		"LICENCE*",
	},
}

var Yarn = Target{
	Name:       "Yarn",
	TargetName: TargetYarn,
	Icon:       "",
	Color:      color.Hex("#2E2A65"),
	Matcher: func(entry string, isDir bool, ctx *patterns.MatcherContext) bool {
		if isDir {
			patterns.FindAndExtract(entry, yarnSources, yarnSourceMap, ctx)
			return true
		}

		return yarnPattern.Ignores(entry, yarnSources, yarnSourceMap, ctx)
	},
}
