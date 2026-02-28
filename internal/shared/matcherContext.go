package shared

// Post-scan results.
//
// # Since 0.6.0
type MatcherContext struct {
	// Paths and their corresponding sources.
	// Directory paths are having the slash suffix.
	//
	// # Since 0.6.0
	Paths map[string]struct{}

	// Maps directory paths to their corresponding sources.
	//
	// Example:
	// 	"dir" => Source
	//  "dir/subdir" => Source
	//
	// # Since 0.6.0
	External map[string]SourceProvider

	// If any fatal errors were encountered during source extractions,
	// this property will contain an array of failed sources.
	//
	// # Since 0.6.0
	Failed []Source

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
	// 	"src" => 1
	//
	// 	// depth: 1
	// 	"src/components" => 0
	// 	"src/views" => 1
	//
	// # Since 0.6.0
	DepthPaths map[string]int

	// Total number of files scanned.
	//
	// # Since 0.6.0
	TotalFiles int

	// Total number of files matched by the target.
	//
	// # Since 0.6.0
	TotalMatchedFiles int

	// Total number of directories scanned.
	//
	// # Since 0.6.0
	TotalDirs int
}
