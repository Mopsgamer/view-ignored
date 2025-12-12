package targets

import (
	"github.com/gookit/color"
)

var jsrSources = []string{"deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"}
var jsrSourceMap = map[string]SourceExtractor{
	"deno.json":  ExtractJsrJson,
	"deno.jsonc": ExtractJsrJsonc,
	"jsr.json":   ExtractJsrJson,
	"jsr.jsonc":  ExtractJsrJsonc,
}
var jsrPattern = SignedPattern{
	Exclude: []string{
		".git",
		".DS_Store",
	},
}

var Jsr = Target{
	Name:       "JSR",
	TargetName: TargetJsr,
	Icon:       "",
	Color:      color.Hex("#F5DD1E"),
	Matcher: func(entry string, isDir bool, ctx *TargetContext) bool {
		if isDir {
			FindAndExtract(entry, jsrSources, jsrSourceMap, ctx)
			return true
		}

		return jsrPattern.Ignores(entry, jsrSources, jsrSourceMap, ctx)
	},
}
