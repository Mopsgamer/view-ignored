package internal

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/shared"
)

type WalkOptions struct {
	ScanOptions
	Entry fs.DirEntry
	Ctx   *shared.MatcherContext
	Path  string
	Error error
}

func walkIncludes(options WalkOptions) error {
	filesystem := options.FS
	entry := options.Entry
	ctx := options.Ctx
	target := options.Target
	cwd := *options.Cwd
	maxDepth := *options.Depth
	invert := *options.Invert
	signal := options.Signal
	fastDepth := *options.FastDepth
	fastInternal := *options.FastInternal

	path := options.Path

	// This check isn't required in JS
	err := options.Error
	if err != nil {
		return fs.SkipAll
	}

	select {
	case <-signal:
		return fs.SkipAll
	default:
	}

	// This check isn't required in JS
	if path == "." {
		return nil
	}

	// JS mimicry

	isDir := entry.IsDir()
	if isDir {
		ctx.TotalDirs++
	} else {
		ctx.TotalFiles++
	}

	if fastDepth {
		depth, depthSlash := getDepth(path, maxDepth)
		if depth > maxDepth {
			match, err := target.Ignores(shared.IgnoresOptions{
				InitState: shared.InitState{
					FS:     filesystem,
					Cwd:    cwd,
					Ctx:    ctx,
					Signal: signal,
					Target: &target,
				},
				Entry: path,
			})
			if err != nil {
				return err
			}
			shared.InvertSignedPatternMatch(match, invert)

			if len(ctx.Failed) > 0 {
				return fs.SkipAll
			}

			if *match.GetIgnored() {
				if isDir && fastInternal && match.GetKind() == shared.MatchKindInternal {
					return fs.SkipDir
				}
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

	match, err := target.Ignores(shared.IgnoresOptions{
		InitState: shared.InitState{
			FS:     filesystem,
			Cwd:    cwd,
			Ctx:    ctx,
			Signal: signal,
			Target: &target,
		},
		Entry: path,
	})
	if err != nil {
		return err
	}
	shared.InvertSignedPatternMatch(match, invert)

	if len(ctx.Failed) > 0 {
		return fs.SkipAll
	}

	if *match.GetIgnored() {
		if isDir && fastInternal && match.GetKind() == shared.MatchKindInternal {
			return fs.SkipDir
		}
		return nil
	}

	if isDir {
		// ctx.TotalMatchedDirs++
		// ctx.DepthPaths[path]++
		depth, _ := getDepth(path, maxDepth)
		if depth <= maxDepth {
			ctx.Paths[path+"/"] = struct{}{}
		}
		return nil
	}

	ctx.TotalMatchedFiles++
	depth, depthSlash := getDepth(path, maxDepth)
	if depth > maxDepth {
		dir := path[:depthSlash]
		ctx.DepthPaths[dir]++
	} else {
		ctx.Paths[path] = struct{}{}
	}

	return nil

}
