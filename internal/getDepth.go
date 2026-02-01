package internal

func getDepth(path string, maxDepth int) (depth, index int) {
	index = -1
	if maxDepth < 0 {
		return
	}
	depth = 0
	for i, c := range path {
		if c != '/' {
			continue
		}
		depth++
		if depth < maxDepth {
			continue
		}
		index = i
		return
	}
	return
}
