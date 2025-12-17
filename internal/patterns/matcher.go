package patterns

import (
	"errors"
	"os"
	"path"
	"slices"
)

// The results and statistics of a scanning operation.
type MatcherContext struct {
	// `view-ignored` does not sort paths.
	Paths []string

	// Maps directory paths to their corresponding sources.
	//
	// Example:
	// 	"src" => Source
	External map[string]*Source

	// If any fatal errors were encountered during source extraction.
	Failed bool

	// Maps directory paths to the quantity of files they contain.
	//
	// Example:
	// 	"src/" => 1
	// 	"src/components/" => 0
	// 	"src/views/" => 1
	// 	"src/views/index.html" => undefined
	DepthPaths map[string]int

	// Total number of files scanned.
	TotalFiles int

	// Total number of files matched by the target.
	TotalMatchedFiles int

	// Total number of directories scanned.
	TotalDirs int
}

// Represents a list of positive minimatch patterns.
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

// Represents a set of include and exclude patterns.
// These patterns are positive minimatch patterns.
//
// See [PatternMatcher].
type SignedPattern struct {
	Include, Exclude Pattern
}

// Combined internal and external patterns for matching.
// [PatternMatcher.exclude] patterns take precedence over [PatternMatcher.include] patterns.
//
// [PatternMatcher.internal] patterns take precedence over [PatternMatcher.external] patterns.
//
// See [SignedPattern.Ignores].
type PatternMatcher struct {
	Internal, External SignedPattern
}

// Checks whether a given entry path should be ignored based on its patterns.
//
// See [FindAndExtract].
// See [SignedPattern.Ignores].
// See https://github.com/Mopsgamer/view-ignored/tree/main/src/targets for usage examples.
type Ignores = func(cwd string, entry string, ctx *MatcherContext) (ignores bool)

// Represents a source of patterns for matching paths.
type Source struct {
	// Patterns defined within the source file.
	// Those patterns are for ignoring files.
	Pattern SignedPattern

	// Name of the source file.
	Name string

	// Relative path to the source file.
	Path string

	// Indicates if the matching logic is inverted.
	// For example, `package.json` `files` field inverts the matching logic,
	// because it specifies files to include rather than exclude.
	Inverted bool

	// Error encountered during extraction, if any.
	//
	// See [SourceExtractor].
	Error error
}

// Adds a negatable pattern to the source's pattern lists.
// Strips the leading '!' for include patterns,
// and adds to exclude patterns otherwise.
func (source *Source) PushNegatable(pattern string) {
	if len(pattern) > 0 && pattern[0] == '!' {
		source.Pattern.Include = append(source.Pattern.Include, pattern[1:])
	}
	source.Pattern.Exclude = append(source.Pattern.Exclude, pattern)
}

type Extraction int

const (
	ExtractionStop Extraction = iota
	ExtractionContinue
)

// Populates a `Source` object from the content of a source file.
//
// See [Source.Pattern] for more details.
type SourceExtractor = func(source *Source, content []byte) Extraction

// Populates the [MatcherContext.External] map with [Source] objects.
func FindAndExtract(
	cwd, directory string,
	sources []string,
	matcher map[string]SourceExtractor,
	ctx *MatcherContext,
) {
	parent := path.Dir(directory)
	if directory != "." {
		FindAndExtract(cwd, parent, sources, matcher, ctx)
	}

	for name := range slices.Values(sources) {
		var path string
		if directory == "." {
			path = name
		} else {
			path = directory + "/" + name
		}

		source := Source{
			Inverted: false,
			Name:     name,
			Path:     path,
			Pattern: SignedPattern{
				Exclude: []string{},
				Include: []string{},
			},
		}

		buff, err := os.ReadFile(cwd + "/" + path)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			source.Error = err
		}

		ctx.External[directory] = &source

		sourceExtractor, ok := matcher[name]
		if !ok {
			err := errors.New("no extractor for source file '" + name + "'")
			source.Error = err
			ctx.Failed = true
			break
		}

		r := sourceExtractor(&source, buff)
		if err != nil {
			ctx.Failed = true
			source.Error = err
			break
		}

		if source.Error != nil {
			continue
		}

		if r == ExtractionStop {
			ctx.Failed = true
		}

		break
	}

	if _, ok := ctx.External[directory]; !ok {
		ctx.External[directory] = ctx.External[parent]
	}
}

// Checks whether a given entry should be ignored based on internal and external patterns.
// Populates unknown sources using [FindAndExtract].
func (internal SignedPattern) Ignores(
	cwd, entry string,
	sources []string,
	sourceMap map[string]SourceExtractor,
	ctx *MatcherContext,
) bool {
	parent := path.Dir(entry)
	source, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(cwd, parent, sources, sourceMap, ctx)
		if ctx.Failed {
			return false
		}
		source, ok = ctx.External[parent]
		if !ok {
			return false
		}
	}

	matcher := PatternMatcher{
		Internal: internal,
		External: source.Pattern,
	}

	check := false
	var err error

	check, err = matcher.Internal.Exclude.Matches(entry)
	if err != nil {
		goto Error
	}
	if check {
		return true
	}

	check, err = matcher.Internal.Include.Matches(entry)
	if err != nil {
		goto Error
	}
	if check {
		return false
	}

	if !source.Inverted {
		check, err = matcher.External.Include.Matches(entry)
		if err != nil {
			goto Error
		}
		if check {
			return source.Inverted
		}

		check, err = matcher.External.Exclude.Matches(entry)
		if err != nil {
			goto Error
		}
		if check {
			return !source.Inverted
		}
	} else {
		check, err = matcher.External.Exclude.Matches(entry)
		if err != nil {
			goto Error
		}
		if check {
			return !source.Inverted
		}

		check, err = matcher.External.Include.Matches(entry)
		if err != nil {
			goto Error
		}
		if check {
			return source.Inverted
		}
	}

	return source.Inverted

Error:
	source.Error = err
	return false
}
