package targets

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var Git = PrintableTarget{
	Name:       "Git",
	TargetName: TargetGit,
	Check:      "git ls-tree -r <git-branch-name> --name-only",
	Icon:       "",
	Color:      color.Hex("#F44E28"),
	Target: Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *patterns.MatcherContext) patterns.SignedPatternMatch {
			extractors := []patterns.Extractor{
				patterns.Extractor{
					Extract: patterns.ExtractGitignore,
					Path:    ".gitignore",
				},
				patterns.Extractor{
					Extract: patterns.ExtractGitignore,
					Path:    ".git/info/exclude",
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
