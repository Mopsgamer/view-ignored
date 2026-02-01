package main

import (
	"bytes"
	"errors"
	"maps"
	"os"
	"os/exec"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"testing"

	"github.com/Mopsgamer/view-ignored/internal"
	"github.com/Mopsgamer/view-ignored/internal/targets"
	"github.com/stretchr/testify/assert"
)

func TestScanNPMSelfFlat(t *testing.T) {
	assert := assert.New(t)
	npm, err := npmTotalFiles()
	if err != nil {
		t.Fatalf("npmTotalFiles error: %v", err)
	}
	ctx := internal.Scan(internal.ScanOptions{Target: targets.Npm.Target, FastInternal: new(true)})
	if !assert.False(ctx.Failed) {
		return
	}
	if !assert.NotEmpty(ctx.Paths) {
		return
	}
	assert.Equal(ctx.TotalMatchedFiles, npm.Total)
	assert.Equal(npm.Total, len(npm.Files))
	paths := filterFiles(maps.Keys(ctx.Paths))
	slices.SortFunc(paths, internal.FirstFolders)
	slices.SortFunc(npm.Files, internal.FirstFolders)
	assert.ElementsMatch(paths, npm.Files)
}

type npmFilesResult struct {
	Total int
	Files []string
}

func npmTotalFiles() (*npmFilesResult, error) {
	cmd := exec.Command("npm", "pack", "--dry-run")
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "NO_COLOR=1")
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &out
	if err := cmd.Run(); err != nil {
		return nil, errors.New(out.String())
	}
	output := out.String()
	re := regexp.MustCompile(`total files:\s+(\d+)`)
	match := re.FindStringSubmatch(output)
	lines := strings.Split(output, "\n")
	var files []string
	inContents := false
	for _, line := range lines {
		if strings.HasPrefix(line, "npm notice Tarball Contents") {
			inContents = true
			continue
		}
		if !inContents {
			continue
		}
		if strings.HasPrefix(line, "npm notice Tarball Details") {
			break
		}
		if m := regexp.MustCompile(`npm notice\s+\S+\s+(.+)`).FindStringSubmatch(line); m != nil {
			files = append(files, strings.TrimSpace(m[1]))
		}
	}
	if len(match) > 1 {
		total, _ := strconv.Atoi(match[1])
		return &npmFilesResult{Total: total, Files: files}, nil
	}
	return nil, errNoTotalFiles
}

var errNoTotalFiles = &exec.ExitError{} // or define a better error
