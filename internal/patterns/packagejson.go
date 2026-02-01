package patterns

import (
	"encoding/json"
)

type NodeJsManifest struct {
	Files *[]string `json:"files"`
}

func ExtractPackageJson(source *Source, content []byte, _ *MatcherContext) {
	dist := NodeJsManifest{}
	source.Inverted = true
	err := json.Unmarshal(content, &dist)
	if err != nil {
		source.Error = err
		return
	}

	if dist.Files == nil {
		return
	}

	for _, pattern := range *dist.Files {
		source.PushNegatable(pattern)
	}
}

var _ ExtractorFn = (ExtractorFn)(ExtractPackageJson)
