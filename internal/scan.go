package internal

import (
	"io/fs"
	"math"
	"os"

	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/Mopsgamer/view-ignored/internal/targets"
)

type DepthMode int

const (
	DepthNone DepthMode = iota
	DepthFiles
)

type ScanOptions struct {
	// Provides the matcher to use for scanning.
	Target targets.Target

	// Current working directory to start the scan from.
	Cwd *string

	// If enabled, the scan will return files that are ignored by the target matchers.
	Invert *bool

	// Starting from depth `0` means you will see
	// children of the current working directory.
	Depth *int

	// Return as soon as possible.
	Signal <-chan struct{}

	// If enabled, Depth will be calculated faster by skipping
	// other files after first match.
	// This makes the scan faster but affects patterns.MatcherContext's
	// TotalDirs, TotalFiles, TotalMatchedFiles and DepthPaths.
	FastDepth *bool
}

// Scan the directory for included files based on the provided targets.
func Scan(options *ScanOptions) patterns.MatcherContext {
	if options == nil {
		options = new(ScanOptions)
	}
	if options.Cwd == nil {
		options.Cwd = new(".")
	}
	if options.Depth == nil {
		options.Depth = new(math.MaxInt)
	}
	if options.Invert == nil {
		options.Invert = new(false)
	}
	// Signal can be nil.
	if options.FastDepth == nil {
		options.FastDepth = new(false)
	}

	ctx := patterns.MatcherContext{
		Paths:      []string{},
		External:   make(map[string]*patterns.Source),
		DepthPaths: make(map[string]int),
	}

	fs.WalkDir(
		os.DirFS("."),
		*options.Cwd,
		walkIncludes(options.Target.Ignores, options, &ctx),
	)

	return ctx
}

func walkIncludes(ignores patterns.Ignores, options *ScanOptions, ctx *patterns.MatcherContext) fs.WalkDirFunc {
	cwd := *options.Cwd
	fastDepth := *options.FastDepth
	maxDepth := *options.Depth
	invert := *options.Invert
	return func(path string, entry fs.DirEntry, err error) error {
		select {
		case <-options.Signal:
			return fs.SkipAll
		default:
		}

		if path == "." {
			return nil
		}

		isDir := entry.IsDir()
		if isDir {
			ctx.TotalDirs++
		} else {
			ctx.TotalFiles++
		}

		if fastDepth {
			depth, depthSlash := getDepth(path, maxDepth)
			if depth > maxDepth {
				ignored := ignores(cwd, path, ctx)
				if ctx.Failed {
					return fs.SkipAll
				}

				if invert {
					ignored = !ignored
				}

				if ignored {
					return nil
				}

				if isDir {
					// ctx.TotalMatchedDirs++
					// ctx.DepthPaths[path]++
					return nil
				}

				ctx.TotalMatchedFiles++
				dir := path[:depthSlash]
				ctx.DepthPaths[dir]++
				return fs.SkipDir
			}
		}

		ignored := ignores(cwd, path, ctx)
		if ctx.Failed {
			return fs.SkipAll
		}

		if invert {
			ignored = !ignored
		}

		if ignored {
			return nil
		}

		if isDir {
			// ctx.TotalMatchedDirs++
			// ctx.DepthPaths[path]++
			depth, _ := getDepth(path, maxDepth)
			if depth <= maxDepth {
				ctx.Paths = append(ctx.Paths, path+"/")
			}
			return nil
		}

		ctx.TotalMatchedFiles++
		depth, depthSlash := getDepth(path, maxDepth)
		if depth > maxDepth {
			dir := path[:depthSlash]
			ctx.DepthPaths[dir]++
		} else {
			ctx.Paths = append(ctx.Paths, path)
		}

		return nil
	}
}

func getDepth(path string, maxDepth int) (depth, index int) {
	index = -1
	if maxDepth < 0 {
		return
	}
	depth = 0
	for i, c := range path {
		if c != '/' {
			continue
		}
		depth++
		if depth < maxDepth {
			continue
		}
		index = i
		return
	}
	return
}
