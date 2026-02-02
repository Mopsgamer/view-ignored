package internal

import (
	"io/fs"

	"github.com/Mopsgamer/view-ignored/internal/patterns"
)

type WalkOptions struct {
	ScanOptions
	Entry fs.DirEntry
	Ctx   *patterns.MatcherContext
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
			match := target.Ignores(filesystem, cwd, path, ctx)
			patterns.InvertSignedPatternMatch(match, invert)

			if ctx.Failed {
				return fs.SkipAll
			}

			if *match.Ignored() {
				if isDir && fastInternal && match.Kind() == patterns.MatchKindGroupInternal {
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

	match := target.Ignores(filesystem, cwd, path, ctx)
	patterns.InvertSignedPatternMatch(match, invert)

	if ctx.Failed {
		return fs.SkipAll
	}

	if *match.Ignored() {
		if isDir && fastInternal && match.Kind() == patterns.MatchKindGroupInternal {
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
