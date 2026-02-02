package internal

import (
	"fmt"
	"maps"
	"slices"
	"strings"
	"time"

	"github.com/Mopsgamer/view-ignored/internal/patterns"
	"github.com/Mopsgamer/view-ignored/internal/targets"
	"github.com/gookit/color"
)

type PrintOptions struct {
	ScanOptions
	DepthPaths *DepthMode
	Summary    *bool
	Paths      *bool
	Nerd       *bool
}

func Print(targetName targets.TargetName, options *PrintOptions) bool {
	if *options.Paths {
		ctx := Scan(options.ScanOptions)
		errors := uniqueValues(ctx.External)
		perrors := pluralizeErrors(len(errors))
		if len(errors) > 0 {
			fmt.Printf("\nFound %d "+perrors+"\n", len(errors))
			for _, err := range errors {
				fmt.Println(err)
			}
			if ctx.Failed {
				return false
			}
		}
		paths := slices.Collect(maps.Keys(ctx.Paths))
		slices.SortFunc(paths, FirstFolders)
		depthPaths(paths, ctx.DepthPaths)
		fmt.Println(strings.Join(paths, "\n"))
		return true
	}

	target := targetName.Target()

	includeInfo := "includes"
	if *options.ScanOptions.Invert {
		includeInfo = "ignores"
	}

	head := target.Color.Sprint(target.Name) + " " + includeInfo
	if *options.Nerd {
		head = target.Color.Sprint(target.Icon+" "+target.Name) + " " + includeInfo
	}
	fmt.Println(head + "..")

	start := time.Now()
	ctx := Scan(options.ScanOptions)
	errors := uniqueValues(ctx.External)
	perrors := pluralizeErrors(len(errors))
	if len(errors) > 0 {
		color.Red.Printf("\n%d "+perrors+"\n", len(errors))
		for _, err := range errors {
			fmt.Println(color.Red.Sprint(err))
		}
		if ctx.Failed {
			return false
		}
	}

	paths := slices.Collect(maps.Keys(ctx.Paths))
	slices.SortFunc(paths, FirstFolders)
	depthPaths(paths, ctx.DepthPaths)
	if !*options.Summary {
		fmt.Println("")
		fmt.Println(strings.Join(paths, "\n"))
	}
	if *options.Summary {
		head = ""
	} else {
		head += " "
	}
	fmt.Printf("\n%s%s files - %s", head, colorNumber(ctx.TotalMatchedFiles), colorNumber(time.Since(start)))
	fmt.Printf("\nLooked through %s files and %s dirs\n", colorNumber(ctx.TotalFiles), colorNumber(ctx.TotalDirs))

	if target.Check != "" {
		fmt.Print("\nYou can use " + color.Magenta.Sprint("'"+target.Check+"'") + " to check if the list is valid.\n")
	}

	return true
}

func depthPaths(paths []string, dp map[string]int) {
	for i, dir := range paths {
		if !strings.HasSuffix(dir, "/") {
			continue
		}
		d := dp[dir[:len(dir)-1]]
		if d == 0 {
			continue
		}
		_ = slices.Replace(paths, i, i+1, (paths)[i]+"..."+color.Gray.Sprintf("+%d", d))
	}
}

func pluralizeErrors(count int) string {
	if count == 1 {
		return "error"
	}
	return "errors"
}

func colorNumber[T ~int | ~int64 | ~float64](n T) string {
	return colorNumberStr(fmt.Sprintf("%v", n))
}

func colorNumberStr(s string) string {
	var out strings.Builder
	buf := ""

	flushDigits := func() {
		if buf != "" {
			out.WriteString(color.Green.Sprint(buf))
			buf = ""
		}
	}

	for _, r := range s {
		if r >= '0' && r <= '9' {
			buf += string(r)
			continue
		}
		flushDigits()

		if r == '.' {
			out.WriteString(color.Red.Sprint(string(r)))
		} else {
			out.WriteString(color.White.Sprint(string(r)))
		}
	}

	flushDigits()
	return out.String()
}

func uniqueValues(m map[string]*patterns.Source) (result []error) {
	for _, source := range m {
		if source.Error == nil {
			continue
		}
		result = append(result, source.Error)
	}

	return
}
