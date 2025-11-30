package targets

import (
	"os"
	"path"
	"slices"
)

type SourceExtractor = func(source string, content []byte) (exclude, include []string, err error)

func FindAndExtract(directory string, sources []string, matcher SourceExtractor, ctx *MatcherContext) {
	keys := []string{}
	ctx.SourceErrors = []error{}
	for source := range slices.Values(sources) {
		var sourceErr error = nil
		for {
			bytes, err := os.ReadFile(directory + "/" + source)
			if err != nil && !os.IsNotExist(err) {
				sourceErr = err
				break
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

			// put gitignore into patterns
			include, exclude, err := ExtractGitignore(source, bytes)
			if err != nil {
				sourceErr = err
				break
			}
			for _, key := range keys {
				m, ok := ctx.External[key]
				if !ok {
					m = &Pattern{}
					ctx.External[key] = m
				}
				m.Exclude = append(m.Exclude, exclude...)
				m.Include = append(m.Include, include...)
			}
			keys = []string{}
			directory = dir
		}

		if sourceErr != nil {
			ctx.SourceErrors = append(ctx.SourceErrors, sourceErr)
			return
		}
	}
}
