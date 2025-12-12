package patterns

import (
	"errors"
	"os"
	"path"
	"slices"
)

type MatcherContext struct {
	Paths             []string
	External          map[string]*Source // Ignore patterns for each dir
	SourceErrors      []error
	TotalFiles        int
	TotalMatchedFiles int
	TotalDirs         int
}

type Pattern []string

func (patterns Pattern) Matches(path string) (bool, error) {
	for _, pattern := range patterns {
		matched, err := GitignoreMatch(pattern, path)
		if err != nil {
			return false, err
		}
		if matched {
			return true, nil
		}
	}
	return false, nil
}

type SignedPattern struct {
	Include, Exclude Pattern
}

type PatternMatcher struct {
	Internal, External SignedPattern
}

type PathChecker = func(path string, isDir bool, ctx *MatcherContext) (ignores bool)

type Source struct {
	Pattern  SignedPattern
	Name     string
	Inverted bool
}

type SourceExtractor = func(source *Source, content []byte) (err error)

func FindAndExtract(directory string, sources []string, matcher map[string]SourceExtractor, ctx *MatcherContext) {
	keys := []string{}
	ctx.SourceErrors = []error{}
	for sourceFileName := range slices.Values(sources) {
		for {
			bytes, err := os.ReadFile(directory + "/" + sourceFileName)
			if err != nil && !os.IsNotExist(err) {
				ctx.SourceErrors = append(ctx.SourceErrors, err)
				return
			}

			dir := path.Dir(directory)
			_, exists := ctx.External[directory]
			if !exists {
				keys = append(keys, directory)
			}
			if os.IsNotExist(err) {
				if directory == "." {
					break
				}
				directory = dir
				continue
			}

			if directory == "." && len(keys) == 0 {
				break
			}

			sourceExtractor, ok := matcher[sourceFileName]
			if !ok {
				err = errors.New("no extractor for source file: " + sourceFileName)
				ctx.SourceErrors = append(ctx.SourceErrors, err)
				break
			}

			source := new(Source)
			source.Name = sourceFileName
			err = sourceExtractor(source, bytes)
			if err != nil {
				ctx.SourceErrors = append(ctx.SourceErrors, err)
				break
			}
			for _, key := range keys {
				m := ctx.External[key]
				if m == nil {
					ctx.External[key] = source
				}
			}
			if directory == "." {
				return
			}
			keys = []string{}
			directory = dir
		}
	}
}

// Is ignored for `exclude` or `include` or `fallback`.
func (internal SignedPattern) Ignores(file string, sources []string, sourceMap map[string]SourceExtractor, ctx *MatcherContext) bool {
	parent := path.Dir(file)
	source, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(parent, sources, sourceMap, ctx)
		if len(ctx.SourceErrors) > 0 {
			return false
		}
		source, ok = ctx.External[parent]
	}
	if !ok {
		return false
	}

	matcher := PatternMatcher{
		Internal: internal,
		External: source.Pattern,
	}

	check := false
	var err error

	check, err = matcher.Internal.Exclude.Matches(file)
	if err != nil {
		goto Error
	}
	if check {
		return true
	}

	check, err = matcher.Internal.Include.Matches(file)
	if err != nil {
		goto Error
	}
	if check {
		return false
	}

	check, err = matcher.External.Exclude.Matches(file)
	if err != nil {
		goto Error
	}
	if check {
		return true
	}

	check, err = matcher.External.Include.Matches(file)
	if err != nil {
		goto Error
	}
	if check {
		return false
	}

	return source.Inverted

Error:
	ctx.SourceErrors = append(ctx.SourceErrors, err)
	return false
}
