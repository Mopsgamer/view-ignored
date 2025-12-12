package targets

import (
	"encoding/json"
)

type JsrManifest struct {
	Exclude *[]string `json:"exclude"`
	Include *[]string `json:"include"`
	Publish *struct {
		Exclude *[]string `json:"exclude"`
		Include *[]string `json:"include"`
	} `json:"publish"`
}

var ExtractJsrJson SourceExtractor = func(source string, content []byte) (pattern Pattern, def bool, err error) {
	dist := JsrManifest{}
	def = true
	err = json.Unmarshal(content, &dist)
	if err != nil {
		return
	}

	if dist.Publish == nil {
		if dist.Exclude != nil {
			pattern.Exclude = append(pattern.Exclude, *dist.Exclude...)
		}
	} else if dist.Publish.Exclude != nil {
		pattern.Exclude = append(pattern.Exclude, *dist.Publish.Exclude...)
	}

	if dist.Publish == nil {
		if dist.Include != nil {
			pattern.Include = append(pattern.Include, *dist.Include...)
		}
	} else if dist.Publish.Include != nil {
		pattern.Include = append(pattern.Include, *dist.Publish.Include...)
	}

	return
}

var ExtractJsrJsonc SourceExtractor = func(source string, content []byte) (pattern Pattern, def bool, err error) {
	content = StripJSONC(content)
	return ExtractJsrJson(source, content)
}

func StripJSONC(src []byte) []byte {
	out := make([]byte, 0, len(src))
	inLine := false
	inBlock := false

	for i := 0; i < len(src); i++ {

		if !inLine && !inBlock && i+1 < len(src) && src[i] == '/' && src[i+1] == '/' {
			inLine = true
			i++
			continue
		}

		if !inLine && !inBlock && i+1 < len(src) && src[i] == '/' && src[i+1] == '*' {
			inBlock = true
			i++
			continue
		}

		if inLine && src[i] == '\n' {
			inLine = false
			out = append(out, '\n')
			continue
		}

		if inBlock && i+1 < len(src) && src[i] == '*' && src[i+1] == '/' {
			inBlock = false
			i++
			continue
		}

		if !inLine && !inBlock {
			out = append(out, src[i])
		}
	}

	return out
}
