package main

import (
	"flag"
	"fmt"
	"io/fs"
	"os"
	"strings"
	"time"

	"github.com/Mopsgamer/view-ignored/targets"
)

func main() {
	scan := flag.NewFlagSet("scan", flag.ExitOnError)
	target := scan.String("target", targets.TargetGit.String(), "the scan `target`. Supported targets: "+targets.SupportedTargetsList())
	flag.Parse()
	switch flag.Arg(0) {
	case "scan":
		scan.Parse(flag.Args()[1:])
		if !targets.IsTarget(target) {
			fmt.Printf("error: unsupported target: %s, supported targets are "+targets.SupportedTargetsList()+"\n", *target)
			os.Exit(1)
		}
		mainScan(targets.Target(*target))
	case "":
		fmt.Println("See -h for help.")
		os.Exit(1)
	}
}

func walkIgnore(ignores targets.Matcher, ctx *targets.MatcherContext) fs.WalkDirFunc {
	return func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		ignored, err := ignores(path, d.IsDir(), ctx)
		if err != nil || ignored {
			// ctx.Paths = append(ctx.Paths, path)
			return err
		}

		if d.IsDir() {
			path += "/"
		}
		ctx.Paths = append(ctx.Paths, path)
		return nil
	}
}

func mainScan(target targets.Target) {
	fmt.Println("Target: " + target)
	pwd, _ := os.Getwd()
	fmt.Println("PWD: " + pwd)
	fmt.Println("")

	start := time.Now()
	ctx := targets.MatcherContext{
		Paths:    []string{},
		External: make(map[string]*targets.Pattern),
	}

	fs.WalkDir(os.DirFS("."), ".", walkIgnore(targets.IgnoresFor(target), &ctx))
	fmt.Println(strings.Join(ctx.Paths, "\n"))
	fmt.Printf("\nMatched %d files in %v\n", len(ctx.Paths), time.Since(start))
}
