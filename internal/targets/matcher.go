package targets

type Pattern struct {
	Exclude []string
	Include []string
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
func Ignores(internal, external Pattern, name string, def bool) (bool, error) {
	check := false
	var err error

	check, err = MatchAny(internal.Exclude, name)
	if err != nil {
		goto Error
	}
	if check {
		return true, nil
	}

	check, err = MatchAny(internal.Include, name)
	if err != nil {
		goto Error
	}
	if check {
		return false, nil
	}

	check, err = MatchAny(external.Exclude, name)
	if err != nil {
		goto Error
	}
	if check {
		return true, nil
	}

	check, err = MatchAny(external.Include, name)
	if err != nil {
		goto Error
	}
	if check {
		return false, nil
	}

	return def, nil

Error:
	return false, err
}
