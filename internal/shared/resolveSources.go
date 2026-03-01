package shared

import (
	"errors"
	"io/fs"
	"path"
	"slices"
	"strings"
)

// See [ResolveSources].
//
// # Since 0.6.0
type ResolveSourcesOptions struct {
	PatternFinderOptions
	// Relative directory path.
	//
	// Example:
	//  "dir/subdir"
	//
	// # Since 0.6.0
	Dir string
}

// Populates the [MatcherContext.External] map with [Source] objects.
//
// # Since 0.6.0
func ResolveSources(options ResolveSourcesOptions) error {
	dir := options.Dir

	if _, has := options.Ctx.External[dir]; has {
		return nil
	}

	var sourcep SourceProvider
	var err error
	noSourceDirList := []string{dir}

	if dir != "." {
		dir = path.Dir(dir)

		// find source from an ancestor [dir < ... < cwd]
		for {
			select {
			case <-options.Signal:
				return fs.SkipAll
			default:
			}

			source, has := options.Ctx.External[dir]
			if has {
				// if cache is found populate descendants [cwd > ... > dir]
				for _, noSourceDir := range noSourceDirList {
					options.Ctx.External[noSourceDir] = source
				}
				return nil
			}
			noSourceDirList = append(noSourceDirList, dir)
			parent := path.Dir(dir)
			if dir == parent {
				break
			}
			dir = parent
			continue
		}
	}

	// else
	// find non-cwd source [root > cwd) and populate [cwd > ... > dir]

	preCwdSegments := []string{}
	if strings.HasPrefix(options.Root, "/") {
		c := path.Dir(options.Cwd)
		for {
			select {
			case <-options.Signal:
				return fs.SkipAll
			default:
			}

			preCwdSegments = append(preCwdSegments, c)
			if c == "/" || c == options.Root {
				break
			}
			parent := path.Dir(c)
			c = parent
		}
		slices.Reverse(preCwdSegments)

		sourcep, err = findSourceForAbsoluteDirs(preCwdSegments, options.Ctx, options.FS, options.Target, options.Signal)
		if err != nil {
			return err
		}
		if sourcep != nil && !sourcep.IsNone() {
			for _, noSourceDir := range noSourceDirList {
				select {
				case <-options.Signal:
					return fs.SkipAll
				default:
				}
				options.Ctx.External[noSourceDir] = sourcep
			}
		}
	}

	absPaths := []string{}
	for _, rel := range noSourceDirList {
		absPaths = append(absPaths, Join(options.Cwd, rel))
	}
	sourcep, err = findSourceForAbsoluteDirs(absPaths, options.Ctx, options.FS, options.Target, options.Signal)
	if err != nil {
		return err
	}
	if sourcep != nil {
		for _, noSourceDir := range noSourceDirList {
			select {
			case <-options.Signal:
				return fs.SkipAll
			default:
			}
			options.Ctx.External[noSourceDir] = sourcep
		}
	}
	return nil
}

func findSourceForAbsoluteDirs(
	paths []string,
	ctx *MatcherContext,
	fs_ fs.FS,
	target *Target,
	signal <-chan struct{},
) (SourceProvider, error) {
	for _, parent := range paths {
		for _, extractor := range target.Extractors {
			select {
			case <-signal:
				return nil, fs.SkipAll
			default:
			}
			sourcep := tryExtractor(parent, fs_, ctx, extractor)
			if sourcep == nil || sourcep.IsNone() {
				continue
			}
			source, ok := sourcep.(Source)
			if ok {
				if source.Error != nil {
					ctx.Failed = append(ctx.Failed, &source)
				}
				return source, nil
			}
		}
	}
	return SourceNone{}, nil
}

func tryExtractor(
	cwd string,
	fs_ fs.FS,
	ctx *MatcherContext,
	extractor Extractor,
) SourceProvider {
	abs := Join(cwd, extractor.Path)
	path := Relative(cwd, abs)
	name := Base(path)

	newSource := Source{
		Name:     name,
		Path:     path,
		Pattern:  []SignedPattern{},
		Inverted: false,
		Error:    nil,
	}

	buff, err := fs.ReadFile(fs_, path)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return SourceNone{}
		}
		newSource.Error = err
		return newSource
	}

	act := extractor.Extract(&newSource, buff, ctx)
	if act == ExtractorContinue {
		return SourceNone{}
	}
	return newSource
}
