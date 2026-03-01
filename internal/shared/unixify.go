package shared

import (
	"os"
	"regexp"
	"strings"
)

var cwd, _ = os.Getwd()
var strippedCwd = strip(cwd)

func Unixify(path string) string {
	result := strip(path)
	if strings.HasPrefix(result, "./") {
		result = strippedCwd + result[1:]
	} else if !strings.HasPrefix(result, "/") {
		result = strippedCwd + "/" + result
	}
	return result
}

func Join(from string, p2 string) string {
	if p2 == "." || p2 == "./" {
		return from
	} else if strings.HasPrefix(p2, "./") {
		from += "/" + p2[2:]
	} else {
		from += "/" + p2
	}

	return from
}

func Relative(base string, to string) string {
	if !strings.HasSuffix(base, "/") {
		base += "/"
	}
	result := strings.Replace(to, base, "", 1)
	return result
}

func Base(path string) string {
	return path[strings.LastIndex(path, "/")+1:]
}

var stripRe = regexp.MustCompile("^[a-zA-Z]:")

func strip(path string) string {
	path = strings.ReplaceAll(path, "\\", "/")
	path = string(stripRe.ReplaceAll([]byte(path), []byte("")))
	return path
}
