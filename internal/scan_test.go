package internal

import (
	"math"
	"testing"

	"github.com/Mopsgamer/view-ignored/internal/targets"
)

func BenchmarkScan(b *testing.B) {
	o := &ScanOptions{
		Entry:  new2("."),
		Invert: new2(false),
		Depth:  new2(math.MaxInt),
	}
	for b.Loop() {
		Scan(targets.TargetGit, o)
	}
}

func BenchmarkScanNil(b *testing.B) {
	for b.Loop() {
		Scan(targets.TargetGit, nil)
	}
}
