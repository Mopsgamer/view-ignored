package patterns

import "slices"

// Represents a list of positive minimatch patterns.
type Pattern []string

func (patterns Pattern) Matches(path string) (string, error) {
	for pattern := range slices.Values(patterns) {
		matched, err := GitignoreMatch(pattern, path)
		if err != nil {
			return "", err
		}
		if matched {
			return pattern, nil
		}
	}
	return "", nil
}
