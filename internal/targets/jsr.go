package targets

import (
	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/Mopsgamer/view-ignored/internal/shared"
	"github.com/gookit/color"
)

var extractorsJsr = []shared.Extractor{
	{
		Extract: patterns.ExtractJsrJson,
		Path:    "jsr.json",
	},
	{
		Extract: patterns.ExtractJsrJsonc,
		Path:    "jsr.jsonc",
	},
}

var internalJsr = []*shared.SignedPattern{
	new(shared.SignedPattern{
		Excludes: true,
		Pattern:  []string{".git", ".DS_Store"},
	}).Compile(shared.StringCompileOptions{}),
}

// # Since 0.6.0
var Jsr = shared.PrintableTarget{
	Name:       "JSR",
	TargetName: TargetJsr.String(),
	Icon:       "",
	Color:      color.Hex("#F5DD1E"),
	Target: shared.Target{
		Extractors: extractorsJsr,
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
				Internal: internalJsr,
				Entry:    o.Entry,
			})
		},
	},
}
