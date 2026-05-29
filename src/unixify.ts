export function unixify(p: string): string {
	if (!p) return ""
	if (p.indexOf("\\") === -1) return p
	return p.replaceAll("\\", "/")
}

export function join(a: string, b: string): string {
	if (!a || a === ".") return b
	if (!b || b === ".") return a
	const last = a.charCodeAt(a.length - 1)
	if (last === 47) return a + b
	return a + "/" + b
}

export function dirname(p: string): string {
	const lastSlash = p.lastIndexOf("/")
	if (lastSlash === -1) return "."
	if (lastSlash === 0) return "/"
	return p.slice(0, lastSlash)
}

export function strip(p: string): string {
	if (p.length > 1 && p.charCodeAt(1) === 58) return p.slice(2)
	return p
}
