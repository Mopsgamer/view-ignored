package targets

import (
	"encoding/json"
	"strings"
)

type NodeJsManifest struct {
	Files *[]string `json:"files"`
}

var ExtractPackageJson SourceExtractor = func(source string, content []byte) (pattern Pattern, def bool, err error) {
	dist := NodeJsManifest{}
	def = true
	err = json.Unmarshal(content, &dist)
	if err != nil {
		return
	}

	if dist.Files == nil {
		return
	}

	for _, p := range *dist.Files {
		if strings.HasPrefix(p, "!") {
			pattern.Exclude = append(pattern.Exclude, p[1:])
		} else {
			pattern.Include = append(pattern.Include, p)
		}
	}
	return
}
