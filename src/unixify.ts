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
        from = from.substring(2)
    }
    from += p2.substring(start)

	return from
}

export function relative(base: string, to: string): string {
	if (!base.endsWith("/")) {
		base += "/"
	}
	const result = to.replace(base, "")
	return result
}

export function base(path: string): string {
	return path.substring(path.lastIndexOf("/") + 1)
}

function strip(path: string): string {
	return path.replaceAll("\\", "/").replace(/^[a-zA-Z]:/, "")
}
