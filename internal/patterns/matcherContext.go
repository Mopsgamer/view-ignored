package patterns

// The results and statistics of a scanning operation.
type MatcherContext struct {
	// Paths of all included files.
	Paths map[string]struct{}

	// Maps directory paths to their corresponding sources.
	//
	// Example:
	// 	"src" => Source
	External map[string]*Source

	// If any fatal errors were encountered during source extraction.
	Failed bool

	// Maps directory paths to the quantity of files they contain.
	//
	// Example:
	// 	// for
	// 	"src/"
	// 	"src/components/"
	// 	"src/views/"
	// 	"src/views/index.html"
	//
	// 	// depth: 0
	// 	"src/" => 1
	//
	// 	// depth: 1
	// 	"src/components/" => 0
	// 	"src/views/" => 1
	DepthPaths map[string]int

	// Total number of files scanned.
	TotalFiles int

	// Total number of files matched by the target.
	TotalMatchedFiles int

	// Total number of directories scanned.
	TotalDirs int
}

// TODO: patchers
