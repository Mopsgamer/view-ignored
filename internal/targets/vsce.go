package targets

import (
	"github.com/gookit/color"
)

var vsceSources = []string{"package.json", ".vscodeignore"}
var vsceSourceMap = map[string]SourceExtractor{
	"package.json":  ExtractPackageJson,
	".vscodeignore": ExtractGitignore,
}
var vscePattern = SignedPattern{
	Exclude: []string{
		".git",
		".DS_Store",
	},
}

var Vsce = Target{
	Name:       "VSCE",
	TargetName: TargetVsce,
	Check:      "vsce ls",
	Icon:       "󰨞",
	Color:      color.Hex("#23A9F1"),
	Matcher: func(entry string, isDir bool, ctx *TargetContext) bool {
		if isDir {
			FindAndExtract(entry, vsceSources, vsceSourceMap, ctx)
			return true
		}

		return vscePattern.Ignores(entry, vsceSources, vsceSourceMap, ctx)
	},
}
