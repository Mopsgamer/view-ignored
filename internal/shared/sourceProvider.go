package shared

type SourceProvider interface {
	IsNone() bool
}

type SourceNone struct{}

func (s SourceNone) IsNone() bool {
	return true
}

var _ SourceProvider = (*SourceNone)(nil)

func (s Source) IsNone() bool {
	return false
}

var _ SourceProvider = (*Source)(nil)
