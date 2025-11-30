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
func Ignores(internal, external Pattern, ctx *MatcherContext, name string, def bool) bool {
	check := false
	var err error

	check, err = MatchAny(internal.Exclude, name)
	if err != nil {
		goto Error
	}
	if check {
		return true
	}

	check, err = MatchAny(internal.Include, name)
	if err != nil {
		goto Error
	}
	if check {
		return false
	}

	check, err = MatchAny(external.Exclude, name)
	if err != nil {
		goto Error
	}
	if check {
		return true
	}

	check, err = MatchAny(external.Include, name)
	if err != nil {
		goto Error
	}
	if check {
		return false
	}

	return def

Error:
	ctx.SourceErrors = append(ctx.SourceErrors, err)
	return false
}
