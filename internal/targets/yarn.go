package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/Mopsgamer/view-ignored/internal/shared"
	"github.com/gookit/color"
)

var extractorsYarn = []shared.Extractor{
	{
		Extract: patterns.ExtractPackageJsonNocase,
		Path:    "package.json",
	},
	{
		Extract: patterns.ExtractGitignoreNocase,
		Path:    ".npmignore",
	},
	{
		Extract: patterns.ExtractGitignoreNocase,
		Path:    ".gitignore",
	},
}

var internalIncludeYarn = shared.SignedPattern{
	Excludes: false,
	Pattern:  shared.Pattern{},
	Compiled: []shared.PatternMinimatch{},
}

var internalYarn = []shared.SignedPattern{
	internalIncludeYarn,
	shared.SignedPattern{
		Excludes: true,
		Pattern: []string{
			// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L26
			"/package.tgz",

			".github",
			".git",
			".hg",
			"node_modules",

			".npmignore",
			".gitignore",

			".#*",
			".DS_Store",
		},
	}.Compile(shared.StringCompileOptions{}),
	shared.SignedPattern{

		Excludes: false,
		Pattern: []string{
			// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
			"/package.json",
			"/README",
			"/README.*",
			"/LICENSE",
			"/LICENSE.*",
			"/LICENCE",
			"/LICENCE.*",
		},
	}.Compile(shared.StringCompileOptions{NoCase: true}),
}

var Yarn = shared.PrintableTarget{
	Name:       "Yarn",
	TargetName: TargetYarn.String(),
	Icon:       "",
	Color:      color.Hex("#2E2A65"),
	Target: shared.Target{
		Extractors: extractorsYarn,
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
				Internal: internalYarn,
			})
		},
	},
}
