package internal

import (
	"fmt"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/Mopsgamer/view-ignored/internal/targets"
)

type PrintOptions struct {
	ScanOptions
	Summary *bool
	Paths   *bool
}

func Print(target targets.Target, options *PrintOptions) {
	if *options.Paths {
		ctx := Scan(target, &options.ScanOptions)
		slices.SortFunc(ctx.Paths, FirstFolders)
		for i, p := range ctx.Paths {
			t := strings.IndexAny(p, "\t")
			if t <= 0 {
				continue
			}
			ctx.Paths[i] = p[:t]
		}
		fmt.Println(strings.Join(ctx.Paths, "\n"))
		return
	}
	fmt.Println("Target: " + target)
	pwd, _ := os.Getwd()
	fmt.Println("PWD: " + pwd)

	start := time.Now()
	ctx := Scan(target, &options.ScanOptions)
	slices.SortFunc(ctx.Paths, FirstFolders)
	if !*options.Summary {
		fmt.Println("")
		fmt.Println(strings.Join(ctx.Paths, "\n"))
	}
	fmt.Printf("\nLooked through %d files and %d dirs", ctx.TotalFiles, ctx.TotalDirs)
	fmt.Printf("\nMatched %d files in %v\n", ctx.TotalMatchedFiles, time.Since(start))

	if len(ctx.SourceErrors) > 0 {
		fmt.Printf("\nFound %d errors\n", len(ctx.SourceErrors))
		for _, err := range ctx.SourceErrors {
			fmt.Println(err.Error())
		}
	}
}
