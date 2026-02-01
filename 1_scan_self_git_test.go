package main

import (
	"bytes"
	"iter"
	"maps"
	"os"
	"os/exec"
	"slices"
	"strings"
	"testing"

	"github.com/Mopsgamer/view-ignored/internal"
	"github.com/Mopsgamer/view-ignored/internal/targets"
	"github.com/stretchr/testify/assert"
)

func TestScanGitSelf(t *testing.T) {
	assert := assert.New(t)
	files, err := gitFiles()
	if err != nil {
		t.Fatalf("gitFiles error: %v", err)
	}
	ctx := internal.Scan(internal.ScanOptions{Target: targets.Git.Target, FastInternal: new(true)})
	if !assert.False(ctx.Failed) {
		return
	}
	if !assert.NotEmpty(ctx.Paths) {
		return
	}
	paths := filterFiles(maps.Keys(ctx.Paths))
	slices.SortFunc(paths, internal.FirstFolders)
	slices.SortFunc(files, internal.FirstFolders)
	assert.ElementsMatch(paths, files)
}

func gitFiles() ([]string, error) {
	cmd := exec.Command("git", "ls-tree", "-r", "HEAD", "--name-only")
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "NO_COLOR=1")
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	if err := cmd.Run(); err != nil {
		return nil, err
	}
	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	return lines, nil
}

func filterFiles(paths iter.Seq[string]) []string {
	out := []string{}
	for p := range paths {
		if strings.HasSuffix(p, "/") {
			continue
		}
		out = append(out, p)
	}
	return out
}
