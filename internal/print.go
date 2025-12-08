package internal

import (
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/Mopsgamer/view-ignored/internal/targets"
	"github.com/gookit/color"
)

type PrintOptions struct {
	ScanOptions
	Summary *bool
	Paths   *bool
	Nerd    *bool
}

func Print(targetName targets.TargetName, options *PrintOptions) {
	if *options.Paths {
		ctx := Scan(targetName, &options.ScanOptions)
		for i, p := range ctx.Paths {
			t := strings.Index(p, "...")
			if t <= 0 {
				continue
			}
			ctx.Paths[i] = p[:t]
		}
		slices.SortFunc(ctx.Paths, FirstFolders)
		fmt.Println(strings.Join(ctx.Paths, "\n"))
		return
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
	ctx := Scan(targetName, &options.ScanOptions)
	slices.SortFunc(ctx.Paths, FirstFolders)
	if !*options.Summary {
		fmt.Println("")
		fmt.Println(strings.Join(ctx.Paths, "\n"))
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

	if len(ctx.SourceErrors) > 0 {
		fmt.Printf("\nFound %d errors\n", len(ctx.SourceErrors))
		for _, err := range ctx.SourceErrors {
			fmt.Println(err.Error())
		}
	}
}

func colorNumber[T ~int | ~int64 | ~float64](n T) string {
	return colorNumberStr(fmt.Sprintf("%v", n))
}

func colorNumberStr(s string) string {
	out := ""
	buf := ""

	flushDigits := func() {
		if buf != "" {
			out += color.Green.Sprint(buf)
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
			out += color.Red.Sprint(string(r))
		} else {
			out += color.White.Sprint(string(r))
		}
	}

	flushDigits()
	return out
}
