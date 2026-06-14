/**
 * Replaces backslashes with forward slashes.
 *
 * @since 0.6.0
 */
export function unixify(p: string): string {
	if (!p) return ""
	const res = p.indexOf("\\") === -1 ? p : p.replaceAll("\\", "/")
	let start = 0
	let end = res.length
	if (end >= 2 && res.charCodeAt(0) === 46 && res.charCodeAt(1) === 47) {
		start = 2
	}
	if (end > start + 1 && res.charCodeAt(end - 1) === 47) {
		end--
	}
	if (start === 0 && end === res.length) return res || "."
	return res.slice(start, end) || "."
}

/**
 * Joins two path segments with a forward slash.
 *
 * @since 0.6.0
 */
export function join(a: string, b: string): string {
	if (!a || a === ".") return b
	if (!b || b === ".") return a
	if (a.charCodeAt(a.length - 1) === 47) return a + b
	return a + "/" + b
}

/**
 * Returns the directory name of a path.
 *
 * @since 0.6.0
 */
export function dirname(p: string): string {
	const lastSlash = p.lastIndexOf("/")
	if (lastSlash === -1) return "."
	if (lastSlash === 0) return "/"
	return p.slice(0, lastSlash)
}

/**
 * Strips Windows drive letters and replaces backslashes.
 *
 * @since 0.6.0
 */
export function strip(p: string): string {
	const res = unixify(p)
	if (res.length > 1 && res.charCodeAt(1) === 58) {
		return res.slice(2)
	}
	return res
}
