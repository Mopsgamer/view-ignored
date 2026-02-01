package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/gookit/color"
)

var Npm = PrintableTarget{
	Name:       "NPM",
	TargetName: TargetNpm,
	Check:      "npm pack --dry-run",
	Icon:       "",
	Color:      color.Hex("#CA0404"),
	Target: Target{
		Ignores: func(cwd string, entry string, ctx *patterns.MatcherContext) patterns.SignedPatternMatch {
			extractors := []patterns.Extractor{
				patterns.Extractor{
					Extract: patterns.ExtractPackageJson,
					Path:    "package.json",
				},
				patterns.Extractor{
					Extract: patterns.ExtractGitignore,
					Path:    ".npmignore",
				},
				patterns.Extractor{
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
