package targets

import "path"

var denoFiles = []string{"deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"}

var IgnoreJsr Matcher = func(entry string, isDir bool, ctx *MatcherContext) bool {
	internal := Pattern{
		Exclude: []string{
			".git/**",
			".DS_Store/**",
		},
	}

	m := map[string]SourceExtractor{
		"deno.json":  ExtractJsrJson,
		"deno.jsonc": ExtractJsrJsonc,
		"jsr.json":   ExtractJsrJson,
		"jsr.jsonc":  ExtractJsrJsonc,
	}

	if isDir {
		FindAndExtract(entry, denoFiles, m, ctx)
		return true
	}

	parent := path.Dir(entry)
	external, ok := ctx.External[parent]
	if !ok {
		FindAndExtract(entry, denoFiles, m, ctx)
		if len(ctx.SourceErrors) > 0 {
			return false
		}
		external, ok = ctx.External[parent]
	}
	if !ok {
		return false
	}

	return Ignores(internal, external.Pattern, ctx, entry, external.Inverted)
}
