package targets

import (
	"path"

	"github.com/gookit/color"
)

var vsceFiles = []string{"package.json", ".vscodeignore"}

var Vsce = Target{
	Name:       "VSCE",
	TargetName: TargetVsce,
	Check:      "vsce ls",
	Icon:       "󰨞",
	Color:      color.Hex("#23A9F1"),
	Matcher: func(entry string, isDir bool, ctx *MatcherContext) bool {
		internal := Pattern{
			Exclude: []string{
				".git/**",
				".DS_Store/**",
			},
		}

		m := map[string]SourceExtractor{
			"package.json":  ExtractPackageJson,
			".vscodeignore": ExtractGitignore,
		}

		if isDir {
			FindAndExtract(entry, vsceFiles, m, ctx)
			return true
		}

		parent := path.Dir(entry)
		external, ok := ctx.External[parent]
		if !ok {
			FindAndExtract(parent, vsceFiles, m, ctx)
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
