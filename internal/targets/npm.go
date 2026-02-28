package targets

import (
	"io/fs"

	"github.com/gookit/color"
)

var Npm = shared.PrintableTarget{
	Name:       "NPM",
	TargetName: TargetNpm.String(),
	Check:      "npm pack --dry-run",
	Icon:       "",
	Color:      color.Hex("#CA0404"),
	Target: shared.Target{
		Ignores: func(fs fs.FS, cwd string, entry string, ctx *shared.MatcherContext) shared.SignedPatternMatch {
			extractors := []shared.Extractor{
				{
					Extract: shared.ExtractPackageJson,
					Path:    "package.json",
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
