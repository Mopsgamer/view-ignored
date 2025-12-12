package targets

import (
	"encoding/json"
	"strings"
)

type NodeJsManifest struct {
	Files *[]string `json:"files"`
}

func ExtractPackageJson(source *Source, content []byte) (err error) {
	dist := NodeJsManifest{}
	source.Inverted = true
	err = json.Unmarshal(content, &dist)
	if err != nil {
		return
	}

	if dist.Files == nil {
		return
	}

	for _, p := range *dist.Files {
		if strings.HasPrefix(p, "!") {
			source.Exclude = append(source.Exclude, p[1:])
		} else {
			source.Include = append(source.Include, p)
		}
	}
	return
}

var _ SourceExtractor = (SourceExtractor)(ExtractPackageJson)
