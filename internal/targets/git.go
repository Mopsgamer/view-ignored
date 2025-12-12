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

var Git = Target{
	Name:       "Git",
	TargetName: TargetGit,
	Check:      "git ls-tree -r <git-branch-name> --name-only",
	Icon:       "",
	Color:      color.Hex("#F44E28"),
	Matcher: func(entry string, isDir bool, ctx *patterns.MatcherContext) bool {
		if isDir {
			patterns.FindAndExtract(entry, gitSources, gitSourceMap, ctx)
			return true
		}

		return gitPattern.Ignores(entry, gitSources, gitSourceMap, ctx)
	},
}
