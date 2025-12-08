package targets

import (
	"fmt"

	"github.com/gookit/color"
)

type TargetIcon struct {
	Icon  string
	Color color.RGBColor
}

var _ fmt.Stringer = (*TargetName)(nil)

func (ti TargetIcon) String() string {
	return ti.Color.Sprint(ti.Icon)
}
