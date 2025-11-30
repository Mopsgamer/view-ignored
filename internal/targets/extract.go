package targets

import (
	"os"
	"path"
	"slices"
)

type SourceExtractor = func(source string, content []byte) (exclude, include []string, def bool, err error)

func FindAndExtract(directory string, sources []string, matcher map[string]SourceExtractor, ctx *MatcherContext) {
	keys := []string{}
	ctx.SourceErrors = []error{}
	for source := range slices.Values(sources) {
		for {
			bytes, err := os.ReadFile(directory + "/" + source)
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

			// put gitignore into patterns
			include, exclude, def, err := matcher[source](source, bytes)
			if err != nil {
				ctx.SourceErrors = append(ctx.SourceErrors, err)
				break
			}
			for _, key := range keys {
				m, ok := ctx.External[key]
				if !ok {
					m = &Source{}
					ctx.External[key] = m
				}
				m.Exclude = append(m.Exclude, exclude...)
				m.Include = append(m.Include, include...)
				m.Inverted = def
				m.Name = source
			}
			if directory == "." {
				return
			}
			keys = []string{}
			directory = dir
		}
	}
}
