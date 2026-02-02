package targets

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var Yarn = PrintableTarget{
	Name:       "Yarn",
	TargetName: TargetYarn,
	Icon:       "",
	Color:      color.Hex("#2E2A65"),
	Target: Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *patterns.MatcherContext) patterns.SignedPatternMatch {
			extractors := []patterns.Extractor{
				{
					Extract: patterns.ExtractPackageJson,
					Path:    "package.json",
				},
				{
					Extract: patterns.ExtractGitignore,
					Path:    ".yarnignore",
				},
				{
					Extract: patterns.ExtractGitignore,
					Path:    ".npmignore",
				},
				{
					Extract: patterns.ExtractGitignore,
					Path:    ".gitignore",
				},
			}

			internal := patterns.SignedPattern{
				Exclude: []string{
					".git",
					".DS_Store",
					"node_modules",
					".*.swp",
					"._*",
					".DS_Store",
					".git",
					".gitignore",
					".hg",
					".npmignore",
					".npmrc",
					".lock-wscript",
					".svn",
					".wafpickle-*",
					"config.gypi",
					"CVS",
					"npm-debug.log",
					".yarnignore",
					".yarnrc",
				},
				Include: []string{
					"bin",
					"package.json",
					"README*",
					"LICENSE*",
					"LICENCE*",
				},
			}

			return internal.Ignores(patterns.SignedPatternIgnoresOptions{
				PatternFinderOptions: patterns.PatternFinderOptions{
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
