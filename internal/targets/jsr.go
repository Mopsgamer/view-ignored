package targets

import (
	"path"

	"github.com/gookit/color"
)

var jsrFiles = []string{"deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"}

var Jsr = Target{
	Name:       "JSR",
	TargetName: TargetJsr,
	Icon: TargetIcon{
		Icon:  "",
		Color: color.Hex("#F5DD1E"),
	},
	Matcher: func(entry string, isDir bool, ctx *MatcherContext) bool {
		internal := Pattern{
			Exclude: []string{
				".git/**",
				".DS_Store/**",
			},
		}

		m := map[string]SourceExtractor{
			"deno.json":  ExtractJsrJson,
			"deno.jsonc": ExtractJsrJsonc,
			"jsr.json":   ExtractJsrJson,
			"jsr.jsonc":  ExtractJsrJsonc,
		}

		if isDir {
			FindAndExtract(entry, jsrFiles, m, ctx)
			return true
		}

		parent := path.Dir(entry)
		external, ok := ctx.External[parent]
		if !ok {
			FindAndExtract(parent, jsrFiles, m, ctx)
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
