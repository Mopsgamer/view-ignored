export function getDepth(path: string, maxDepth: number) {
	if (path.endsWith("/")) {
		path = path.substring(0, path.length - 1)
	}
	const result = {
		depth: 0,
		depthSlash: -1,
	}
	let i = -1
	for (const c of path) {
		i++
		if (c !== "/") {
			continue
		}
		if (result.depth === maxDepth) {
			result.depthSlash = i
		}
		result.depth++
	}
	return result
}
