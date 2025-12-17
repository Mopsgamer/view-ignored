package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var gitSources = []string{".gitignore"}
var gitSourceMap = map[string]patterns.SourceExtractor{".gitignore": patterns.ExtractGitignore}
var gitPattern = patterns.SignedPattern{
	Exclude: []string{
		".git",
		".DS_Store",
	},
}

var Git = PrintableTarget{
	Name:       "Git",
	TargetName: TargetGit,
	Check:      "git ls-tree -r <git-branch-name> --name-only",
	Icon:       "",
	Color:      color.Hex("#F44E28"),
	Target: Target{
		Ignores: func(cwd, entry string, ctx *patterns.MatcherContext) bool {
			return gitPattern.Ignores(cwd, entry, gitSources, gitSourceMap, ctx)
		},
	},
}
