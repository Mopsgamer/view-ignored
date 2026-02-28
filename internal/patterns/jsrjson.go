package patterns

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

func ExtractJsrJson(source *Source, content []byte, ctx *MatcherContext) ExtractorNext {
	dist := JsrManifest{}
	include := SignedPattern{}
	exclude := SignedPattern{Excludes: true}
	err := json.Unmarshal(content, &dist)
	if err != nil {
		source.Error = err
		ctx.Failed = true
		return ExtractorBreak
	}

	if dist.Publish == nil {
		if dist.Exclude != nil {
			exclude.Pattern = append(exclude.Pattern, *dist.Exclude...)
		}
	} else if dist.Publish.Exclude != nil {
		exclude.Pattern = append(exclude.Pattern, *dist.Publish.Exclude...)
	}

	if dist.Publish == nil {
		if dist.Include != nil {
			include.Pattern = append(include.Pattern, *dist.Include...)
		}
	} else if dist.Publish.Include != nil {
		include.Pattern = append(include.Pattern, *dist.Publish.Include...)
	}

	for element := range source.Pattern {
		element.Compile()
	}
	return ExtractorBreak
}

var _ ExtractorFn = (ExtractorFn)(ExtractJsrJson)

func ExtractJsrJsonc(source *Source, content []byte, ctx *MatcherContext) ExtractorNext {
	content = StripJSONC(content)
	return ExtractJsrJson(source, content, ctx)
}

var _ ExtractorFn = (ExtractorFn)(ExtractJsrJsonc)

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
