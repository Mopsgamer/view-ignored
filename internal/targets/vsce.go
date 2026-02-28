package targets

import (
	"io/fs"

	"github.com/gookit/color"
)

var Vsce = shared.PrintableTarget{
	Name:       "VSCE",
	TargetName: TargetVsce.String(),
	Check:      "vsce ls",
	Icon:       "󰨞",
	Color:      color.Hex("#23A9F1"),
	Target: shared.Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *shared.MatcherContext) shared.SignedPatternMatch {
			extractors := []shared.Extractor{
				{
					Extract: shared.ExtractPackageJson,
					Path:    "package.json",
				},
				{
					Extract: shared.ExtractGitignore,
					Path:    ".vscodeignore",
				},
				{
					Extract: shared.ExtractGitignore,
					Path:    ".gitignore",
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
