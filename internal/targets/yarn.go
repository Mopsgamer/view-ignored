package targets

import (
	"io/fs"

	"github.com/gookit/color"
)

var Yarn = shared.PrintableTarget{
	Name:       "Yarn",
	TargetName: TargetYarn,
	Icon:       "",
	Color:      color.Hex("#2E2A65"),
	Target: shared.Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *shared.MatcherContext) shared.SignedPatternMatch {
			extractors := []shared.Extractor{
				{
					Extract: shared.ExtractPackageJson,
					Path:    "package.json",
				},
				{
					Extract: shared.ExtractGitignore,
					Path:    ".yarnignore",
				},
				{
					Extract: shared.ExtractGitignore,
					Path:    ".npmignore",
				},
				{
					Extract: shared.ExtractGitignore,
					Path:    ".gitignore",
				},
			}

			internal := shared.SignedPattern{
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
