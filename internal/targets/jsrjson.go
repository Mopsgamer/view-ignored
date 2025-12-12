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

func ExtractJsrJson(source *Source, content []byte) (err error) {
	dist := JsrManifest{}
	source.Inverted = true
	err = json.Unmarshal(content, &dist)
	if err != nil {
		return
	}

	if dist.Publish == nil {
		if dist.Exclude != nil {
			source.Exclude = append(source.Exclude, *dist.Exclude...)
		}
	} else if dist.Publish.Exclude != nil {
		source.Exclude = append(source.Exclude, *dist.Publish.Exclude...)
	}

	if dist.Publish == nil {
		if dist.Include != nil {
			source.Include = append(source.Include, *dist.Include...)
		}
	} else if dist.Publish.Include != nil {
		source.Include = append(source.Include, *dist.Publish.Include...)
	}

	return
}

var _ SourceExtractor = (SourceExtractor)(ExtractJsrJson)

func ExtractJsrJsonc(source *Source, content []byte) (err error) {
	content = StripJSONC(content)
	return ExtractJsrJson(source, content)
}

var _ SourceExtractor = (SourceExtractor)(ExtractJsrJsonc)

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
