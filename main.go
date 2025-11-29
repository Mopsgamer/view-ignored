package main

import (
	"flag"
	"fmt"
	"io/fs"
	"os"
	"strings"

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
		mainScan(target)
	case "":
		fmt.Println("See -h for help.")
		os.Exit(1)
	}
}

func walkCollect(match func(path string) (bool, error), p *[]string) fs.WalkDirFunc {
	return func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		matches, err := match(path)
		if err != nil || matches {
			return err
		}

		if d.IsDir() {
			path += "/"
		}
		*p = append(*p, path)
		return nil
	}
}

func mainScan(target *string) {
	fmt.Println(*target)
	paths := new([]string)
	fs.WalkDir(os.DirFS("."), ".", walkCollect(targets.MatchGit, paths))
	fmt.Println(strings.Join(*paths, "\n"))
	fmt.Printf("\n%d\n", len(*paths))
}
