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

type SourceExtractor = func(source *Source, content []byte) (err error)

func FindAndExtract(directory string, sources []string, matcher map[string]SourceExtractor, ctx *TargetContext) {
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

			sourceExtractor := matcher[sourceFileName]

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
