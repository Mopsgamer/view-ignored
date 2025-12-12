package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var vsceSources = []string{"package.json", ".vscodeignore"}
var vsceSourceMap = map[string]patterns.SourceExtractor{
	"package.json":  patterns.ExtractPackageJson,
	".vscodeignore": patterns.ExtractGitignore,
}
var vscePattern = patterns.SignedPattern{
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
	Matcher: func(entry string, isDir bool, ctx *patterns.MatcherContext) bool {
		if isDir {
			patterns.FindAndExtract(entry, vsceSources, vsceSourceMap, ctx)
			return true
		}

		return vscePattern.Ignores(entry, vsceSources, vsceSourceMap, ctx)
	},
}
