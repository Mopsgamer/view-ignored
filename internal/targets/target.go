package targets

type Target struct {
	Name       string
	TargetName TargetName
	Check      string
	Icon       TargetIcon

	Matcher Matcher
}
