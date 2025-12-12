package targets

import (
	"github.com/gookit/color"
)

var gitSources = []string{".gitignore"}
var gitSourceMap = map[string]SourceExtractor{".gitignore": ExtractGitignore}
var gitPattern = SignedPattern{
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
	Matcher: func(entry string, isDir bool, ctx *TargetContext) bool {
		if isDir {
			FindAndExtract(entry, gitSources, gitSourceMap, ctx)
			return true
		}

		return gitPattern.Ignores(entry, gitSources, gitSourceMap, ctx)
	},
}
