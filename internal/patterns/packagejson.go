package patterns

import (
	"encoding/json"

	"github.com/Mopsgamer/view-ignored/internal/shared"
)

const ExtractorError shared.ExtractorNext = 2

type NodeJsManifest struct {
	Files *[]string `json:"files"`
}

func ExtractPackageJson(source *shared.Source, content []byte, _ *shared.MatcherContext) shared.ExtractorNext {
	result := extractPackageJson(source, content)
	if result == shared.ExtractorBreak {
		for _, element := range source.Pattern {
			element.Compile(shared.StringCompileOptions{NoCase: true})
		}
	}
	if result == ExtractorError {
		return shared.ExtractorBreak
	}
	return result
}

var _ shared.ExtractorFn = (shared.ExtractorFn)(ExtractPackageJson)

func extractPackageJson(source *shared.Source, content []byte) shared.ExtractorNext {
	source.Inverted = true
	include := shared.SignedPattern{}
	exclude := shared.SignedPattern{Excludes: true}
	dist := NodeJsManifest{}
	err := json.Unmarshal(content, &dist)
	if err != nil {
		source.Error = err
		return ExtractorError
	}

	if dist.Files == nil {
		return shared.ExtractorBreak
	}

	for _, pattern := range *dist.Files {
		source.PushNegatable(pattern, true, include, exclude)
	}
	source.Pattern = append(source.Pattern, include, exclude)

	return shared.ExtractorBreak
}
