package internal

import (
	"io/fs"
	"math"
	"os"
	"path"

	"github.com/Mopsgamer/view-ignored/internal/shared"
)

type DepthMode int

const (
	DepthNone DepthMode = iota
	DepthFiles
)

type ScanOptions struct {
	// Provides the matcher to use for scanning.
	//
	// # Since 0.6.0
	Target shared.Target

	// Current working directory to start the scan from.
	//
	// Default:
	// 	"."
	//
	// # Since 0.6.0
	Cwd *string

	// Limits the scan to a subdirectory of `cwd`.
	// Traversal starts from this subdirectory, but returned paths
	// remain relative to `cwd`, and ignore files from `cwd`
	// are still applied.
	//
	// Default:
	//  "."
	//
	// # Since 0.6.0
	Within *string

	// If enabled, the scan will return files that are ignored by the target matchers.
	//
	// Default:
	// 	false
	//
	// # Since 0.6.0
	Invert *bool

	// Starting from depth `0` means you will see
	// children of the current working directory.
	//
	// Default:
	// 	math.MaxInt
	//
	// # Since 0.6.0
	Depth *int

	// Return as soon as possible.
	//
	// Default:
	// 	nil
	//
	// # Since 0.6.0
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

	// File system interface.
	// Default:
	//	os.DirFS(".")
	FS fs.FS
}

// Scan the directory for included files based on the provided targets.
func Scan(options ScanOptions) (shared.MatcherContext, error) {
	if options.Cwd == nil {
		options.Cwd = new(".")
	}
	if options.Within == nil {
		options.Within = new(".")
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
	if options.FastInternal == nil {
		options.FastInternal = new(false)
	}
	if options.FS == nil {
		options.FS = os.DirFS(".")
	}

	ctx := shared.MatcherContext{
		Paths:      make(map[string]struct{}),
		External:   make(map[string]shared.SourceProvider),
		DepthPaths: make(map[string]int),
	}

	if options.Target.Init != nil {
		err := options.Target.Init(shared.InitState{
			Ctx:    &ctx,
			Cwd:    *options.Cwd,
			FS:     options.FS,
			Signal: options.Signal,
			Target: &options.Target,
		})
		if err != nil {
			return ctx, err
		}
	}

	cwd := options.Cwd
	normalCwd := shared.Unixify(*cwd)
	options.Cwd = &normalCwd

	from := shared.Join(*cwd, *options.Within)

	fs.WalkDir(
		options.FS,
		from,
		func(p string, d fs.DirEntry, err error) error {
			parentPath := path.Dir(p)
			p = shared.Relative(normalCwd, shared.Unixify(parentPath)+"/"+d.Name())
			return walkIncludes(WalkOptions{
				ScanOptions: options,
				Ctx:         &ctx,
				Entry:       d,
				Path:        p,
				Error:       err,
			})
		},
	)

	return ctx, nil
}
