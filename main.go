package main

import (
	"flag"
	"fmt"
	"math"
	"os"

	"github.com/Mopsgamer/view-ignored/internal"
	"github.com/Mopsgamer/view-ignored/internal/targets"
	"github.com/gookit/color"
)

func main() {
	scan := flag.NewFlagSet("scan", flag.ExitOnError)
	target := (*targets.TargetName)(scan.String("target", targets.TargetGit.String(), "the scan `target`. Supported targets: "+targets.SupportedTargetsList()))
	invert := scan.Bool("invert", false, "invert the scan results")
	depth := scan.Int("depth", math.MaxInt, "the scan depth for nested dirs")
	depthPaths := (*internal.DepthMode)(scan.Int("depth-paths", int(internal.DepthNone), "the scan depth for nested dirs"))
	nerd := scan.Bool("nerd", false, "print with NF icons")
	summary := scan.Bool("sum", false, "print only the number of matched files and errors")
	paths := scan.Bool("paths", false, "print only parsable paths, one per line")
	flag.Usage = func() {
		fmt.Println("Usage of view-ignored:")
		fmt.Println("")
		fmt.Println("viewig " + color.Green.Sprint("scan") + " -h\t\tprint scan usage")
		fmt.Println("")
		fmt.Println("GitHub: " + color.Blue.Sprint("github.com/Mopsgamer/view-ignored"))
		os.Exit(1)
	}
	flag.Parse()
	switch flag.Arg(0) {
	case "scan":
		scan.Parse(flag.Args()[1:])
		if !targets.IsTarget(target) {
			fmt.Printf("Given target %s is not supported. Supported targets are "+targets.SupportedTargetsList()+"\n", *target)
			os.Exit(1)
		}
		ok := internal.Print(targets.TargetName(*target), &internal.PrintOptions{
			ScanOptions: internal.ScanOptions{
				Invert:     invert,
				Depth:      depth,
				DepthPaths: depthPaths,
			},
			Summary: summary,
			Paths:   paths,
			Nerd:    nerd,
		})
		if !ok {
			os.Exit(1)
		}
	case "help", "":
		flag.Usage()
	}
}
