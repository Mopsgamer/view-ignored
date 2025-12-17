package patterns

import (
	"encoding/json"
)

type NodeJsManifest struct {
	Files *[]string `json:"files"`
}

func ExtractPackageJson(source *Source, content []byte) Extraction {
	dist := NodeJsManifest{}
	source.Inverted = true
	err := json.Unmarshal(content, &dist)
	if err != nil {
		source.Error = err
		return ExtractionContinue
	}

	if dist.Files == nil {
		return ExtractionContinue
	}

	for _, pattern := range *dist.Files {
		source.PushNegatable(pattern)
	}

	return ExtractionContinue
}

var _ SourceExtractor = (SourceExtractor)(ExtractPackageJson)
