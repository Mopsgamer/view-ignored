package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var Jsr = PrintableTarget{
	Name:       "JSR",
	TargetName: TargetJsr,
	Icon:       "",
	Color:      color.Hex("#F5DD1E"),
	Target: Target{
		Ignores: func(cwd string, entry string, ctx *patterns.MatcherContext) patterns.SignedPatternMatch {
			extractors := []patterns.Extractor{
				patterns.Extractor{
					Extract: patterns.ExtractJsrJson,
					Path:    "deno.json",
				},
				patterns.Extractor{
					Extract: patterns.ExtractJsrJsonc,
					Path:    "deno.jsonc",
				},
				patterns.Extractor{
					Extract: patterns.ExtractJsrJson,
					Path:    "jsr.json",
				},
				patterns.Extractor{
					Extract: patterns.ExtractJsrJsonc,
					Path:    "jsr.jsonc",
				},
			}

			internal := patterns.SignedPattern{
				Exclude: []string{".git", ".DS_Store"},
				Include: []string{},
			}

			return internal.Ignores(patterns.SignedPatternIgnoresOptions{
				PatternFinderOptions: patterns.PatternFinderOptions{
					Ctx:        ctx,
					Cwd:        cwd,
					Extractors: extractors,
				},
				Internal: internal,
				Entry:    entry,
			})
		},
	},
}
