package internal

import (
	"strings"
)

// Files and folders are sorted by their names.
// Folders are displayed before files.
//
// See other implementations here:
// https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
func FirstFolders(a, b string) int {
	a, b = StripDepthPaths(a), StripDepthPaths(b)
	if a == b {
		return 0
	}
	comp := 0
	for comp == 0 {
		aShift, bShift := shiftPath(a), shiftPath(b)
		a, b = aShift.Other, bShift.Other

		comp = strings.Compare(aShift.Next, bShift.Next)

		if aShift.IsLast == bShift.IsLast {
			if aShift.IsLast {
				break
			}
			continue
		}
		if aShift.Next == "" {
			return -1
		}
		if bShift.Next == "" {
			return +1
		}
		if bShift.IsLast {
			return -1
		}
		return +1
	}

	return comp
}

// Converts dir/... and dir/\x1b... to dir/
func StripDepthPaths(p string) string {
	deadIndex := strings.Index(p, "...")
	if deadIndex < 0 {
		deadIndex = strings.Index(p, "\x1b")
	}
	if deadIndex < 0 {
		return p
	}
	return p[:deadIndex]
}

type shiftResult struct {
	Next   string
	Other  string
	IsLast bool
}

// "path/to/the/file" -> ["path", "to/the/file", false]
// "file" -> ["file", "file", true]
// "file/" -> ["file", "", false]
func shiftPath(p string) shiftResult {
	slashIndex := strings.IndexAny(p, "/\\")
	next := p[:max(0, slashIndex)]
	other := p[max(0, slashIndex+1):]
	r := shiftResult{
		Next:   next,
		Other:  other,
		IsLast: next == "",
	}
	if slashIndex < 0 {
		r.Next = r.Other
	}
	return r
}
