package targets

import (
	"encoding/json"
	"strings"
)

type NodeJsManifest struct {
	Files *[]string `json:"files"`
}

var ExtractPackageJson SourceExtractor = func(source string, content []byte) (include, exclude []string, def bool, err error) {
	dist := NodeJsManifest{}
	def = true
	err = json.Unmarshal(content, &dist)
	if err != nil {
		return
	}

	if dist.Files != nil {
		for _, pattern := range *dist.Files {
			if strings.HasPrefix(pattern, "!") {
				exclude = append(exclude, pattern[1:])
			} else {
				include = append(include, pattern)
			}
		}
	}

	return
}
