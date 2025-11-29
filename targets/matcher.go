package targets

import "path/filepath"

func MatchAny(patterns []string, path string) (bool, error) {
	for _, pattern := range patterns {
		matched, err := filepath.Match(pattern, path)
		if err != nil {
			return false, err
		}
		if matched {
			return true, nil
		}
	}
	return false, nil
}

// Is ignored for `exclude` or `include` or `fallback`.
func Ignores(exclude, include, fallback []string, path string) (bool, error) {
	check := false
	var err error

	check, err = MatchAny(exclude, path)
	if err != nil {
		goto Error
	}
	if check {
		return false, nil
	}

	check, err = MatchAny(include, path)
	if err != nil {
		goto Error
	}
	if check {
		return true, nil
	}

	check, err = MatchAny(fallback, path)
	if err != nil {
		goto Error
	}
	return check, nil

Error:
	return false, err
}
