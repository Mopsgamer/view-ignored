//go:build js && wasm

package internal

import (
	"syscall/js"

	"github.com/Mopsgamer/view-ignored/internal/targets"
)

// Scan(options ScanOptions)
func scan(this js.Value, args []js.Value) any {
	options := args[0]
	js.Global().Get("console").Call("log", "options", options)
	js.Global().Get("console").Call("log", "options.target", options.Get("target"))
	js.Global().Get("console").Call("log", "options.cwd", options.Get("cwd"))
	var target targets.Target
	switch options.Get("target").String() {
	case "git":
		target = targets.Git.Target
	case "npm":
		target = targets.Npm.Target
	default:
		panic("unknown target: " + options.Get("target").String())
	}
	ctx := Scan(ScanOptions{
		Target: target,
		Cwd:    new(options.Get("cwd").String()),
	})

	return ctx
}

func main() {
	js.Global().Set("scan", js.FuncOf(scan))
	select {}
}
