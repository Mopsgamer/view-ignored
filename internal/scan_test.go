package internal

import (
	"math"
	"testing"

	"github.com/Mopsgamer/view-ignored/internal/targets"
)

func BenchmarkScan(b *testing.B) {
	o := ScanOptions{
		Target: targets.Git.Target,
		Cwd:    new("."),
		Invert: new(false),
		Depth:  new(math.MaxInt),
	}
	for b.Loop() {
		Scan(o)
	}
}

func BenchmarkScanNil(b *testing.B) {
	for b.Loop() {
		Scan(ScanOptions{Target: targets.Git.Target})
	}
}
