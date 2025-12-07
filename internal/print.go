package internal

import (
	"fmt"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/Mopsgamer/view-ignored/internal/targets"
)

func Print(target targets.Target, options *ScanOptions) {
	fmt.Println("Target: " + target)
	pwd, _ := os.Getwd()
	fmt.Println("PWD: " + pwd)
	fmt.Println("")

	start := time.Now()
	ctx := Scan(target, options)
	slices.SortFunc(ctx.Paths, FirstFolders)
	fmt.Println(strings.Join(ctx.Paths, "\n"))
	fmt.Printf("\nLooked through %d files and %d dirs", ctx.TotalFiles, ctx.TotalDirs)
	fmt.Printf("\nMatched %d files in %v\n", len(ctx.Paths), time.Since(start))

	if len(ctx.SourceErrors) > 0 {
		fmt.Printf("\nFound %d errors\n", len(ctx.SourceErrors))
		for _, err := range ctx.SourceErrors {
			fmt.Println(err.Error())
		}
	}
}
