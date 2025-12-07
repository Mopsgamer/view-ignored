package internal

import (
	"io/fs"
	"math"
	"os"
	"strings"

	"github.com/Mopsgamer/view-ignored/internal/targets"
)

type ScanOptions struct {
	Entry  *string // The file or directory path to scan
	Invert *bool   // Invert the matching logic
	Depth  *int    // The maximum depth for nested directories
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
	optional(options.Invert, false)
	optional(options.Depth, math.MaxInt)

	ctx := targets.MatcherContext{
		Paths:    []string{},
		External: make(map[string]targets.Source),
	}

	fs.WalkDir(
		os.DirFS("."),
		entry,
		walkIncludes(target.Macher(), &options, &ctx),
	)

	return ctx
}

func walkIncludes(ignores targets.Matcher, options *ScanOptions, ctx *targets.MatcherContext) fs.WalkDirFunc {
	return func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			depth := strings.Count(path, "/")
			if depth > *options.Depth {
				return fs.SkipDir
			}
		}

		ignored := ignores(path, d.IsDir(), ctx)
		if len(ctx.SourceErrors) > 0 {
			return fs.SkipAll
		}

		if !d.IsDir() {
			ctx.TotalFiles++
		} else {
			ctx.TotalDirs++
		}

		if *options.Invert {
			ignored = !ignored
		}

		if !ignored {
			ctx.Paths = append(ctx.Paths, path)
		}

		return nil
	}
}
