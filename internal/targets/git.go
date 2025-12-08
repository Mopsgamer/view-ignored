package targets

import (
	"path"

	"github.com/gookit/color"
)

var gitFiles = []string{".gitignore"}

var Git = Target{
	Name:       "Git",
	TargetName: TargetGit,
	Check:      "git ls-tree -r <git-branch-name> --name-only",
	Icon:       "",
	Color:      color.Hex("#F44E28"),
	Matcher: func(entry string, isDir bool, ctx *MatcherContext) bool {
		internal := Pattern{
			Exclude: []string{
				".git",
				".DS_Store",
			},
		}

		if isDir {
			FindAndExtract(entry, gitFiles, map[string]SourceExtractor{".gitignore": ExtractGitignore}, ctx)
			return true
		}

		parent := path.Dir(entry)
		external, ok := ctx.External[parent]
		if !ok {
			FindAndExtract(parent, gitFiles, map[string]SourceExtractor{".gitignore": ExtractGitignore}, ctx)
			if len(ctx.SourceErrors) > 0 {
				return false
			}
			external, ok = ctx.External[parent]
		}
		if !ok {
			return false
		}

		return Ignores(internal, external.Pattern, ctx, entry, external.Inverted)
	},
}
