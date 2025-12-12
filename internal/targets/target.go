package targets

import "github.com/gookit/color"

type Target struct {
	Name       string
	TargetName TargetName
	Check      string
	Icon       string
	Color      color.RGBColor

	Matcher Matcher
}

type TargetContext struct {
	Paths             []string
	External          map[string]Source // Ignore patterns for each dir
	SourceErrors      []error
	TotalFiles        int
	TotalMatchedFiles int
	TotalDirs         int
}
