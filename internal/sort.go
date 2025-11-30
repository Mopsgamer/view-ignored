package internal

import (
	"strings"
)

func cmp(a, b string) int {
	if a < b {
		return -1
	}
	if a > b {
		return 1
	}
	return 0
}

// Files and folders are sorted by their names.
// Folders are displayed before files.
//
// See other implementations here:
// https://jsr.io/@m234/path/0.1.1/sort-cmp.ts
func FirstFolders(a, b string) int {
	comp := 0
	for comp == 0 {
		aShift, bShift := shiftPath(a), shiftPath(b)
		a, b = aShift.Other, bShift.Other
		comp = cmp(aShift.Next, bShift.Next)
		if aShift.IsLast || bShift.IsLast {
			if aShift.IsLast == bShift.IsLast {
				break
			}

			if !aShift.IsLast {
				return -1
			}

			return +1
		}
	}

	return comp
}

type ShiftResult struct {
	Next   string
	Other  string
	IsLast bool
}

// "path/to/the/file" -> ["path", "to/the/file", false]
// "file" -> ["file", "file", true]
// "file/" -> ["file", "", false]
func shiftPath(p string) ShiftResult {
	slashIndex := strings.IndexAny(p, "/\\")
	next := p[:max(0, slashIndex)]
	r := ShiftResult{
		Next:   next,
		Other:  p[max(0, slashIndex+1):],
		IsLast: next == "",
	}
	if slashIndex < 0 {
		r.Next = r.Other
	}
	return r
}
