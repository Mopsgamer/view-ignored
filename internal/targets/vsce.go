package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/Mopsgamer/view-ignored/internal/shared"
	"github.com/gookit/color"
)

var extractorsVsce = []shared.Extractor{
	{
		Extract: patterns.ExtractPackageJson,
		Path:    "package.json",
	},
	{
		Extract: patterns.ExtractGitignore,
		Path:    ".vscodeignore",
	},
	{
		Extract: patterns.ExtractGitignore,
		Path:    ".gitignore",
	},
}

var internalVsce = []*shared.SignedPattern{
	new(shared.SignedPattern{
		Excludes: true,
		Pattern: []string{
			// https://github.com/microsoft/vscode-vsce/blob/main/src/package.ts#L1633
			".vscodeignore",
			"package-lock.json",
			"npm-debug.log",
			"yarn.lock",
			"yarn-error.log",
			"npm-shrinkwrap.json",
			".editorconfig",
			".npmrc",
			".yarnrc",
			".gitattributes",
			"*.todo",
			"tslint.yaml",
			".eslintrc*",
			".babelrc*",
			".prettierrc*",
			".cz-config.js",
			".commitlintrc*",
			"webpack.config.js",
			"ISSUE_TEMPLATE.md",
			"CONTRIBUTING.md",
			"PULL_REQUEST_TEMPLATE.md",
			"CODE_OF_CONDUCT.md",
			".github",
			".travis.yml",
			"appveyor.yml",
			".git",
			"*.vsix",
			".DS_Store",
			"*.vsixmanifest",
			".vscode-test",
			".vscode-test-web",
		},
	}).Compile(shared.StringCompileOptions{}),
}

var Vsce = shared.PrintableTarget{
	Name:       "VSCE",
	TargetName: TargetVsce.String(),
	Check:      "vsce ls",
	Icon:       "󰨞",
	Color:      color.Hex("#23A9F1"),
	Target: shared.Target{
		Extractors: extractorsVsce,
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
				Internal: internalVsce,
				Entry:    o.Entry,
			})
		},
	},
}
