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
	// TODO: default
	Cwd *string

	// If enabled, the scan will return files that are ignored by the target matchers.
	// Default:
	// 	false
	Invert *bool

	// Starting from depth `0` means you will see
	// children of the current working directory.
	// Default:
	// 	math.MaxInt
	Depth *int

	// Return as soon as possible.
	// Default:
	// 	nil
	Signal <-chan struct{}

	// Works together with [ScanOptions.Depth].
	// If enabled, directories will be processed faster
	// by skipping files after first match.
	//
	// This makes the scan faster but affects
	// [patterns.MatcherContext.TotalDirs],
	// [patterns.MatcherContext.TotalFiles],
	// [patterns.MatcherContext.TotalMatchedFiles]
	// and [patterns.MatcherContext.DepthPaths].
	//
	// It's recommended to use this option unless you
	// need precise statistics.
	// Default:
	// 	false
	FastDepth *bool

	// Enables skipping entire directories for internal matches.
	// For example, when scanning a Git repository,
	// '.git' directory will be skipped without reading its contents.
	//
	// This makes the scan faster but affects
	// [patterns.MatcherContext.TotalDirs],
	// [patterns.MatcherContext.TotalFiles],
	// and [patterns.MatcherContext.DepthPaths].
	//
	// It's recommended to use this option unless the target
	// allows overriding internal patterns.
	// This option should never affect [patterns.MatcherContext.TotalMatchedFiles].
	// Default:
	// 	false
	FastInternal *bool
}

// Scan the directory for included files based on the provided targets.
func Scan(options ScanOptions) patterns.MatcherContext {
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
		Paths:      make(map[string]struct{}),
		External:   make(map[string]*patterns.Source),
		DepthPaths: make(map[string]int),
	}

	fs.WalkDir(
		os.DirFS("."),
		*options.Cwd,
		func(path string, d fs.DirEntry, err error) error {
			return walkIncludes(WalkOptions{
				ScanOptions: options,
				Ctx:         &ctx,
				Entry:       d,
				Path:        path,
				Error:       err,
			})
		},
	)

	return ctx
}
