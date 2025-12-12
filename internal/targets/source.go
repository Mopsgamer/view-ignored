package targets

import (
	"os"
	"path"
	"slices"
)

type Source struct {
	Pattern
	Name     string
	Inverted bool
}

type SourceExtractor = func(source string, content []byte) (pattern Pattern, def bool, err error)

func FindAndExtract(directory string, sources []string, matcher map[string]SourceExtractor, ctx *TargetContext) {
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

			sourceExtractor := matcher[source]
			pattern, def, err := sourceExtractor(source, bytes)
			if err != nil {
				ctx.SourceErrors = append(ctx.SourceErrors, err)
				break
			}
			for _, key := range keys {
				m, ok := ctx.External[key]
				if !ok {
					m = Source{}
				}
				m.Exclude = append(m.Exclude, pattern.Exclude...)
				m.Include = append(m.Include, pattern.Include...)
				m.Inverted = def
				m.Name = source
				ctx.External[key] = m
			}
			if directory == "." {
				return
			}
			keys = []string{}
			directory = dir
		}
	}
}
