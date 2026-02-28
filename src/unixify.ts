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
	} else if (p2.startsWith("./")) {
		from += "/" + p2.substring(2)
	} else {
		from += "/" + p2
	}

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
