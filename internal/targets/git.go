package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/Mopsgamer/view-ignored/internal/shared"
	"github.com/gookit/color"
)

var extractorsGit = []shared.Extractor{
	{
		Extract: patterns.ExtractGitignore,
		Path:    ".gitignore",
	},
	{
		Extract: patterns.ExtractGitignore,
		Path:    ".git/info/exclude",
	},
}

var internalGit = []*shared.SignedPattern{
	new(shared.SignedPattern{
		Excludes: true,
		Pattern:  []string{".git", ".DS_Store"},
	}).Compile(shared.StringCompileOptions{}),
}

// # Since 0.6.0
var Git = shared.PrintableTarget{
	Name:       "Git",
	TargetName: TargetGit.String(),
	Check:      "git ls-files --others --exclude-standard --cached",
	Icon:       "",
	Color:      color.Hex("#F44E28"),
	Target: shared.Target{
		Extractors: extractorsGit,
		Ignores: func(o shared.IgnoresOptions) (shared.SignedPatternMatch, error) {
			return shared.SignedPatternIgnores(shared.SignedPatternIgnoresOptions{
				PatternFinderOptions: shared.PatternFinderOptions{
					FS:     o.FS,
					Ctx:    o.Ctx,
					Cwd:    o.Cwd,
					Signal: o.Signal,
					Root:   ".",
					Target: o.Target,
				},
				Internal: internalGit,
				Entry:    o.Entry,
			})
		},
	},
}
