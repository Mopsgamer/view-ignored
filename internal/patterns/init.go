package patterns

// Initializes the target. For example,
// Yarn reads `package.json` to find `main` and `bin` values,
// so it can forcefully include them.
//
// # Since 0.8.0
type Init func(options InitState)
