package targets

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var Vsce = PrintableTarget{
	Name:       "VSCE",
	TargetName: TargetVsce,
	Check:      "vsce ls",
	Icon:       "󰨞",
	Color:      color.Hex("#23A9F1"),
	Target: Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *patterns.MatcherContext) patterns.SignedPatternMatch {
			extractors := []patterns.Extractor{
				patterns.Extractor{
					Extract: patterns.ExtractPackageJson,
					Path:    "package.json",
				},
				patterns.Extractor{
					Extract: patterns.ExtractGitignore,
					Path:    ".vscodeignore",
				},
				patterns.Extractor{
					Extract: patterns.ExtractGitignore,
					Path:    ".gitignore",
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
				FS:       fs,
				Internal: internal,
				Entry:    entry,
			})
		},
	},
}
