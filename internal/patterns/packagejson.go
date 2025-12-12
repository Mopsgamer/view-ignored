package patterns

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
			source.Pattern.Exclude = append(source.Pattern.Exclude, p[1:])
		} else {
			source.Pattern.Include = append(source.Pattern.Include, p)
		}
	}
	return
}

var _ SourceExtractor = (SourceExtractor)(ExtractPackageJson)
