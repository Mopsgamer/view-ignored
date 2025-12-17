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

var Vsce = PrintableTarget{
	Name:       "VSCE",
	TargetName: TargetVsce,
	Check:      "vsce ls",
	Icon:       "󰨞",
	Color:      color.Hex("#23A9F1"),
	Target: Target{
		Ignores: func(cwd, entry string, ctx *patterns.MatcherContext) bool {
			return vscePattern.Ignores(cwd, entry, vsceSources, vsceSourceMap, ctx)
		},
	},
}
