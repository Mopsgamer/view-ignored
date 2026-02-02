//go:build js && wasm

package internal

import (
	"errors"
	"io/fs"
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
		FS:     jsFs{},
	})

	return ctx
}

func main() {
	js.Global().Set("scan", js.FuncOf(scan))
	select {}
}

type jsFs struct {
	fs js.Value // Reference to the Node.js 'fs' module
}

var _ fs.FS = (*jsFs)(nil)

func (sys jsFs) Open(name string) (fs.File, error) {
	// This method should implement JS-compatible
	// file opener, knowing that sys provides a
	// "NodeJS fs module"-compatible object: { promises }
	// where promises provides:
	// - opendir(path) => Promise<Dir>,
	// - readFile(path, ?{encoding}): Promise<Buffer<ArrayBuffer>>
	// - stat(path): Promise<Stat>
	return nil, errors.New("not implemented")
}

func await(promise js.Value) (js.Value, error) {
	resCh := make(chan js.Value)
	errCh := make(chan error)

	success := js.FuncOf(func(this js.Value, args []js.Value) any {
		resCh <- args[0]
		return nil
	})
	defer success.Release()

	failure := js.FuncOf(func(this js.Value, args []js.Value) any {
		errCh <- errors.New(args[0].Get("message").String())
		return nil
	})
	defer failure.Release()

	promise.Call("then", success).Call("catch", failure)

	select {
	case res := <-resCh:
		return res, nil
	case err := <-errCh:
		return js.Undefined(), err
	}
}

var _ fs.File = (*jsFile)(nil)

type jsFile struct{}

func (f *jsFile) Stat() (fs.FileInfo, error) { return nil, errors.New("not implemented") }
func (f *jsFile) Close() error               { return errors.New("not implemented") }
func (f *jsFile) Read(p []byte) (int, error) {
	return 0, errors.New("not implemented")
}

var _ fs.ReadDirFile = (*jsDir)(nil)

type jsDir struct{}

func (d *jsDir) Stat() (fs.FileInfo, error) {
	// export interface Stat {
	//     isFile(): boolean;
	//     isDirectory(): boolean;
	//     isBlockDevice(): boolean;
	//     isCharacterDevice(): boolean;
	//     isSymbolicLink(): boolean;
	//     isFIFO(): boolean;
	//     isSocket(): boolean;
	//     dev: number;
	//     ino: number;
	//     mode: number;
	//     nlink: number;
	//     uid: number;
	//     gid: number;
	//     rdev: number;
	//     size: number;
	//     blksize: number;
	//     blocks: number;
	//     atimeMs: number;
	//     mtimeMs: number;
	//     ctimeMs: number;
	//     birthtimeMs: number;
	//     atime: Date;
	//     mtime: Date;
	//     ctime: Date;
	//     birthtime: Date;
	// }
	return nil, errors.New("not implemented")
}
func (d *jsDir) Read(p []byte) (int, error) {
	return 0, &fs.PathError{Op: "read", Path: "", Err: errors.New("is a directory")}
}
func (d *jsDir) Close() error {
	return errors.New("not implemented")
}
func (d *jsDir) ReadDir(n int) ([]fs.DirEntry, error) {
	return nil, errors.New("not implemented")
}
