package targets

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/shared"
	"github.com/gookit/color"
)

var Jsr = shared.PrintableTarget{
	Name:       "JSR",
	TargetName: TargetJsr.String(),
	Icon:       "",
	Color:      color.Hex("#F5DD1E"),
	Target: shared.Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *shared.MatcherContext) shared.SignedPatternMatch {
			extractors := []shared.Extractor{
				{
					Extract: shared.ExtractJsrJson,
					Path:    "deno.json",
				},
				{
					Extract: shared.ExtractJsrJsonc,
					Path:    "deno.jsonc",
				},
				{
					Extract: shared.ExtractJsrJson,
					Path:    "jsr.json",
				},
				{
					Extract: shared.ExtractJsrJsonc,
					Path:    "jsr.jsonc",
				},
			}

			internal := shared.SignedPattern{
				Exclude: []string{".git", ".DS_Store"},
				Include: []string{},
			}

			return internal.Ignores(shared.SignedPatternIgnoresOptions{
				PatternFinderOptions: shared.PatternFinderOptions{
					FS:         fs,
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
