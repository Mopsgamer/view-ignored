package patterns

import (
	"encoding/json"
)

const ExtractorError ExtractorNext = 2

type NodeJsManifest struct {
	Files *[]string `json:"files"`
}

func ExtractPackageJson(source *Source, content []byte, _ *MatcherContext) ExtractorNext {
	result := extractPackageJson(source, content)
	if result == ExtractorBreak {
		for element := range source.Pattern {
			element.Compile(StringCompileOptions{NoCase: true})
		}
	}
	if result == ExtractorError {
		return ExtractorBreak
	}
	return result
}

var _ ExtractorFn = (ExtractorFn)(ExtractPackageJson)

func extractPackageJson(source *Source, content []byte) ExtractorNext {
	source.Inverted = true
	include := SignedPattern{}
	exclude := SignedPattern{Excludes: true}
	dist := NodeJsManifest{}
	err := json.Unmarshal(content, &dist)
	if err != nil {
		source.Error = err
		return ExtractorError
	}

	if dist.Files == nil {
		return ExtractorBreak
	}

	for _, pattern := range *dist.Files {
		source.PushNegatable(pattern, true, include, exclude)
	}
	source.Pattern = append(source.Pattern, include, exclude)

	return ExtractorBreak
}
