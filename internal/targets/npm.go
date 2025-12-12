package targets

import (
	"github.com/gookit/color"
)

var npmSources = []string{"package.json", ".npmignore", ".gitignore"}
var npmSourceMap = map[string]SourceExtractor{
	"package.json": ExtractPackageJson,
	".npmignore":   ExtractGitignore,
	".gitignore":   ExtractGitignore,
}
var npmPattern = SignedPattern{
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

var Npm = Target{
	Name:       "NPM",
	TargetName: TargetNpm,
	Check:      "npm pack --dry-run",
	Icon:       "",
	Color:      color.Hex("#CA0404"),
	Matcher: func(entry string, isDir bool, ctx *TargetContext) bool {
		if isDir {
			FindAndExtract(entry, npmSources, npmSourceMap, ctx)
			return true
		}

		return npmPattern.Ignores(entry, npmSources, npmSourceMap, ctx)
	},
}
