export function getDepth(path: string, maxDepth: number) {
	let end = path.length
	if (end > 0 && path.charCodeAt(end - 1) === 47 /* / */) {
		end--
	}
	const result = {
		depth: 0,
		depthSlash: -1,
	}
	let i = path.indexOf("/")
	while (i !== -1 && i < end) {
		if (result.depth === maxDepth) {
			result.depthSlash = i
		}
		result.depth++
		i = path.indexOf("/", i + 1)
	}
	return result
}
