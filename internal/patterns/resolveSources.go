package patterns

import (
	"io/fs"
	"os"
	"path"
	"slices"
	"strings"
)

// See [ResolveSources].
type ResolveSourcesOptions struct {
	PatternFinderOptions
	Dir string
}

// Populates the [MatcherContext.External] map with [Source] objects.
func ResolveSources(options ResolveSourcesOptions) {
	dir := options.Dir

	if _, has := options.Ctx.External[dir]; has {
		return
	}

	for {
		if _, ok := options.Ctx.External[dir]; ok {
			break
		}

		foundSource := false

		for extractor := range slices.Values(options.Extractors) {
			var path string
			if dir == "." {
				path = extractor.Path
			} else {
				path = dir + "/" + extractor.Path
			}
			name := path[strings.LastIndexAny(path, "/")+1:]

			source := Source{
				Inverted: false,
				Name:     name,
				Path:     path,
				Pattern: SignedPattern{
					Exclude: Pattern{},
					Include: Pattern{},
				},
			}

			buff, err := fs.ReadFile(options.FS, path)
			if err != nil {
				if os.IsNotExist(err) {
					continue
				}
				source.Error = err
				options.Ctx.External[dir] = &source
				options.Ctx.Failed = true
				foundSource = true
			}

			options.Ctx.External[dir] = &source
			extractor.Extract(&source, buff, options.Ctx)
			if source.Error != nil {
				options.Ctx.Failed = true
				source.Error = err
				break
			}
			foundSource = true
			break
		}

		parent := path.Dir(dir)
		if !foundSource {
			if _, ok := options.Ctx.External[parent]; ok {
				options.Ctx.External[dir] = options.Ctx.External[parent]
			}
		}

		if dir == parent {
			break
		}
		dir = parent
	}

}
