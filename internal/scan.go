package internal

import (
	"io/fs"
	"os"

	"github.com/Mopsgamer/view-ignored/internal/targets"
)

type ScanOptions struct {
	Entry  *string // The file or directory path to scan
	Invert *bool   // Invert the matching logic
}

func optional[T any](value *T, def T) T {
	if value != nil {
		return *value
	}
	return def
}

// Scans the given file or directory path recursively and returns
func Scan(target targets.Target, options ScanOptions) targets.MatcherContext {
	entry := optional(options.Entry, ".")
	invert := optional(options.Invert, false)
	ctx := targets.MatcherContext{
		Paths:    []string{},
		External: make(map[string]*targets.Pattern),
	}
	fs.WalkDir(os.DirFS("."), entry, walkIncludes(targets.IgnoresFor(target), invert, &ctx))
	return ctx
}

func walkIncludes(ignores targets.Matcher, invert bool, ctx *targets.MatcherContext) fs.WalkDirFunc {
	return func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		ignored, err := ignores(path, d.IsDir(), ctx)
		if invert && !d.IsDir() {
			ignored = !ignored
		}

		if err != nil || ignored {
			// ctx.Paths = append(ctx.Paths, path)
			return err
		}

		ctx.Paths = append(ctx.Paths, path)
		return nil
	}
}
