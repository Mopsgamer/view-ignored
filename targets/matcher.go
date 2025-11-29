package targets

type Pattern struct {
	exclude []string
	include []string
}

func MatchAny(patterns []string, path string) (bool, error) {
	for _, pattern := range patterns {
		matched, err := GitignoreMatch(pattern, path)
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
func Ignores(internal, external Pattern, path string, def bool) (bool, error) {
	check := false
	var err error

	check, err = MatchAny(internal.exclude, path)
	if err != nil {
		goto Error
	}
	if check {
		return false, nil
	}

	check, err = MatchAny(internal.include, path)
	if err != nil {
		goto Error
	}
	if check {
		return true, nil
	}

	check, err = MatchAny(external.exclude, path)
	if err != nil {
		goto Error
	}
	if check {
		return false, nil
	}

	check, err = MatchAny(external.include, path)
	if err != nil {
		goto Error
	}
	if check {
		return true, nil
	}

	return def, nil

Error:
	return false, err
}
