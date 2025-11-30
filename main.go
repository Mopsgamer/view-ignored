package main

import (
	"flag"
	"fmt"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/Mopsgamer/view-ignored/internal"
	"github.com/Mopsgamer/view-ignored/internal/targets"
)

func main() {
	scan := flag.NewFlagSet("scan", flag.ExitOnError)
	target := scan.String("target", targets.TargetGit.String(), "the scan `target`. Supported targets: "+targets.SupportedTargetsList())
	invert := scan.Bool("invert", false, "invert the scan results")
	flag.Usage = func() {
		fmt.Println("Usage of view-ignored:")
		fmt.Println("")
		fmt.Println("viewig scan\t\tscan for git")
		fmt.Println("viewig scan -target npm\tscan for npm")
		fmt.Println("viewig scan -invert\tinvert the scan results")
		fmt.Println("viewig scan -h\t\tprinting help")
		fmt.Println("")
		fmt.Println("Supported targets: " + targets.SupportedTargetsList())
		fmt.Println("")
		fmt.Println("GitHub: github.com/Mopsgamer/view-ignored")
		os.Exit(1)
	}
	flag.Parse()
	switch flag.Arg(0) {
	case "scan":
		scan.Parse(flag.Args()[1:])
		if !targets.IsTarget(target) {
			fmt.Printf("error: unsupported target: %s, supported targets are "+targets.SupportedTargetsList()+"\n", *target)
			os.Exit(1)
		}
		mainScan(targets.Target(*target), *invert)
	case "help", "":
		flag.Usage()
	}
}

func mainScan(target targets.Target, invert bool) {
	fmt.Println("Target: " + target)
	pwd, _ := os.Getwd()
	fmt.Println("PWD: " + pwd)
	fmt.Println("")

	start := time.Now()
	ctx := internal.Scan(target, internal.ScanOptions{
		Invert: &invert,
	})
	slices.SortFunc(ctx.Paths, internal.FirstFolders)
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
