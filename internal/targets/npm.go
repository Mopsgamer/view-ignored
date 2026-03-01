package targets

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/Mopsgamer/view-ignored/internal/shared"
	"github.com/gookit/color"
)

var extractorsNpm = []shared.Extractor{
	{
		Extract: patterns.ExtractPackageJson,
		Path:    "package.json",
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

var internalIncludeNpm = shared.SignedPattern{
	Excludes: false,
	Pattern:  shared.Pattern{}, // filled within init
	Compiled: []shared.PatternMinimatch{},
}

var internalNpm = []shared.SignedPattern{
	internalIncludeNpm,
	shared.SignedPattern{
		Excludes: true,
		Pattern: shared.Pattern{
			// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L16
			".npmignore",
			".gitignore",
			".git",
			".svn",
			".hg",
			"CVS",
			".git",
			".svn",
			".hg",
			"CVS",
			"/.lock-wscript",
			"/.wafpickle-*",
			"/build/config.gypi",
			"npm-debug.log",
			".npmrc",
			".*.swp",
			".DS_Store",
			"._*",
			"*.orig",
			"/archived-packages/**",

			// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L294
			"/node_modules",
			"/package-lock.json",
			"/yarn.lock",
			"/pnpm-lock.yaml",
			"/bun.lockb",
		},
	}.Compile(shared.StringCompileOptions{}),
	shared.SignedPattern{
		Excludes: false,
		Pattern: shared.Pattern{
			// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L287
			"bin",
			"package.json",
			"README",
			"COPYING",
			"LICENSE",
			"LICENCE",
			"README.*",
			"COPYING.*",
			"LICENSE.*",
			"LICENCE.*",
		},
	}.Compile(shared.StringCompileOptions{}),
}

var NPM = shared.PrintableTarget{
	Name:       "NPM",
	TargetName: TargetNpm.String(),
	Check:      "npm pack --dry-run",
	Icon:       "",
	Color:      color.Hex("#CA0404"),
	Target: shared.Target{
		Extractors: extractorsNpm,
		Init: func(options shared.InitState) error {
			var content []byte
			normalCwd := shared.Unixify(options.Cwd)
			content, err := fs.ReadFile(options.FS, normalCwd+"/"+"package.json")
			if err != nil {
				return err
			}

			_, err = NpmManifestParse(content)
			if err != nil {
				return err
			}

			// const set = new Set<string>()

			// TODO: NPM should include bundled deps

			// internalInclude.pattern = Array.from(set)
			// signedPatternCompile(internalInclude, { nocase: true })

			return nil
		},
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
				Internal: internalNpm,
			})
		},
	},
}
