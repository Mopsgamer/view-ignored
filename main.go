package main

import (
	"flag"
	"fmt"
	"math"
	"os"
	"runtime"

	"github.com/Mopsgamer/view-ignored/internal"
	"github.com/Mopsgamer/view-ignored/internal/targets"
)

var ARGINC = 0

func init() {
	if runtime.GOARCH != "wasm" {
		return
	}

	ARGINC++

}

func main() {
	scan := flag.NewFlagSet("scan", flag.ExitOnError)
	target := scan.String("target", targets.TargetGit.String(), "the scan `target`. Supported targets: "+targets.SupportedTargetsList())
	invert := scan.Bool("invert", false, "invert the scan results")
	depth := scan.Int("depth", math.MaxInt, "the scan depth for nested dirs")
	flag.Usage = func() {
		fmt.Println("Usage of view-ignored:")
		fmt.Println("")
		fmt.Println("viewig scan\t\tscan for git")
		fmt.Println("viewig scan -target npm\tscan for npm")
		fmt.Println("viewig scan -invert\tinvert the scan results")
		fmt.Println("viewig scan -h\t\tprint scan usage")
		fmt.Println("")
		fmt.Println("Supported targets: " + targets.SupportedTargetsList())
		fmt.Println("")
		fmt.Println("GitHub: github.com/Mopsgamer/view-ignored")
		os.Exit(1)
	}
	flag.Parse()
	switch flag.Arg(ARGINC + 0) {
	case "scan":
		scan.Parse(flag.Args()[ARGINC+1:])
		if !targets.IsTarget(target) {
			fmt.Printf("error: unsupported target: %s, supported targets are "+targets.SupportedTargetsList()+"\n", *target)
			os.Exit(1)
		}
		internal.Print(targets.Target(*target), internal.ScanOptions{
			Invert: invert,
			Depth:  depth,
		})
	case "help", "":
		flag.Usage()
	}
}
