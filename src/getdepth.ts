export function getDepth(path: string, maxDepth: number) {
	const result = {
		depth: 0,
		depthSlash: 0,
	}
	result.depthSlash = -1
	if (maxDepth < 0) {
		return result
	}
	for (const [i, c] of Array.from(path).entries()) {
		if (c !== "/") {
			continue
		}
		result.depth++
		if (result.depth < maxDepth) {
			continue
		}
		result.depthSlash = i
		return result
	}
	return result
}
