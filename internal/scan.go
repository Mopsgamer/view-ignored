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

func new2[T any](value T) *T {
	return &value
}

// Scans the given file or directory path recursively and returns
func Scan(target targets.Target, options *ScanOptions) targets.MatcherContext {
	if options == nil {
		options = &ScanOptions{}
	}
	if options.Entry == nil {
		options.Entry = new2(".")
	}
	if options.Invert == nil {
		options.Invert = new2(false)
	}
	if options.Depth == nil {
		options.Depth = new2(math.MaxInt)
	}

	ctx := targets.MatcherContext{
		Paths:    []string{},
		External: make(map[string]targets.Source),
	}

	fs.WalkDir(
		os.DirFS("."),
		*options.Entry,
		walkIncludes(target.Macher(), options, &ctx),
	)

	return ctx
}

func walkIncludes(ignores targets.Matcher, options *ScanOptions, ctx *targets.MatcherContext) fs.WalkDirFunc {
	return func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == "." {
			return nil
		}

		depth := strings.Count(path, "/")
		isDir := d.IsDir()

		if isDir {
			ctx.TotalDirs++
		} else {
			ctx.TotalFiles++
		}

		ignored := ignores(path, isDir, ctx)
		if len(ctx.SourceErrors) > 0 {
			return fs.SkipAll
		}

		if *options.Invert {
			ignored = !ignored
		}

		if isDir {
			if depth == *options.Depth && hasIncluded(path, ignores, options, ctx) {
				ctx.Paths = append(ctx.Paths, path+"/")
			}
		} else if !ignored && depth <= *options.Depth {
			ctx.Paths = append(ctx.Paths, path)
		}

		if depth > *options.Depth {
			return fs.SkipDir
		}

		return nil
	}
}

func hasIncluded(path string, ignores targets.Matcher, options *ScanOptions, ctx *targets.MatcherContext) bool {
	sctx := &targets.MatcherContext{
		Paths:    []string{},
		External: make(map[string]targets.Source),
	}
	foundFile := false
	_ = fs.WalkDir(
		os.DirFS("."),
		path,
		func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}

			if d.IsDir() {
				ctx.TotalDirs++
			} else {
				ctx.TotalFiles++
			}

			if d.IsDir() {
				return nil
			}

			ignored := ignores(path, d.IsDir(), sctx)
			if len(sctx.SourceErrors) > 0 {
				return fs.SkipAll
			}

			if *options.Invert {
				ignored = !ignored
			}

			if !ignored {
				foundFile = true
				return fs.SkipAll
			}

			return nil
		},
	)
	return foundFile
}
