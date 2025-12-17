package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var jsrSources = []string{"deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"}
var jsrSourceMap = map[string]patterns.SourceExtractor{
	"deno.json":  patterns.ExtractJsrJson,
	"deno.jsonc": patterns.ExtractJsrJsonc,
	"jsr.json":   patterns.ExtractJsrJson,
	"jsr.jsonc":  patterns.ExtractJsrJsonc,
}
var jsrPattern = patterns.SignedPattern{
	Exclude: []string{
		".git",
		".DS_Store",
	},
}

var Jsr = PrintableTarget{
	Name:       "JSR",
	TargetName: TargetJsr,
	Icon:       "",
	Color:      color.Hex("#F5DD1E"),
	Target: Target{
		Ignores: func(cwd, entry string, ctx *patterns.MatcherContext) bool {
			return jsrPattern.Ignores(cwd, entry, jsrSources, jsrSourceMap, ctx)
		},
	},
}
