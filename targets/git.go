package targets

var GitExclude = []string{
	"**/.git/**",
	"**/.DS_Store/**",
}

var GitInclude = []string{}
var GitFallback = []string{}

func MatchGit(path string) (bool, error) {
	return Ignores(GitExclude, GitInclude, GitFallback, path)
}
