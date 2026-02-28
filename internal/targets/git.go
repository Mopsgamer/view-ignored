package targets

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/shared"
	"github.com/gookit/color"
)

var Git = shared.PrintableTarget{
	Name:       "Git",
	TargetName: TargetGit.String(),
	Check:      "git ls-tree -r <git-branch-name> --name-only",
	Icon:       "",
	Color:      color.Hex("#F44E28"),
	Target: shared.Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *shared.MatcherContext) shared.SignedPatternMatch {
			extractors := []shared.Extractor{
				{
					Extract: shared.ExtractGitignore,
					Path:    ".gitignore",
				},
				{
					Extract: shared.ExtractGitignore,
					Path:    ".git/info/exclude",
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
