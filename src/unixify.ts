const strippedCwd = strip(process.cwd())

export function unixify(path: string): string {
	let result = strip(path)
	if (result.startsWith("./")) {
		result = strippedCwd + result.substring(1)
	} else if (!result.startsWith("/")) {
		result = strippedCwd + "/" + result
	}
	return result
}

export function join(from: string, p2: string): string {
	if (p2 === "." || p2 === "./") {
		return from
	}
	let start = 0
	if (p2.startsWith("./")) {
		start = 2
	}
	if (!from.endsWith("/")) {
		from += "/"
	}
	if (from.startsWith("./")) {
		from = from.slice(2)
	}
	from += p2.slice(start)

	return from
}

export function relative(base: string, to: string): string {
	if (!base.endsWith("/")) {
		base += "/"
	}
	const result = to.replace(base, "")
	return result
}

function strip(path: string): string {
	return path.replaceAll("\\", "/").replace(/^[a-zA-Z]:/, "")
}

export function dirname(path: string): string {
	if (path === "/" || path === ".") return path
	const lastSlash = path.endsWith("/") ? path.lastIndexOf("/", -1) : path.lastIndexOf("/")
	if (lastSlash === -1) {
		return "."
	}
	path = path.slice(0, lastSlash)
	if (path.length === 0) return "/"
	return path
}
