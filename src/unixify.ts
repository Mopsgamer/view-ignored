const strippedCwd = strip(process.cwd())

export function unixify(path: string): string {
	const result = strip(path)
	const c0 = result.charCodeAt(0)
	if (c0 === 46 && result.charCodeAt(1) === 47) {
		// "./"
		return strippedCwd + result.slice(1)
	}
	if (c0 !== 47 && c0 !== 92) {
		// not starts with "/" or "\"
		return strippedCwd + "/" + result
	}
	return result
}

export function join(from: string, p2: string): string {
	if (p2 === "." || p2 === "./") return from

	const p2startsDotSlash = p2.charCodeAt(0) === 46 && p2.charCodeAt(1) === 47
	const start = p2startsDotSlash ? 2 : 0

	let res = from
	if (from.charCodeAt(0) === 46 && from.charCodeAt(1) === 47) {
		res = from.slice(2)
	}

	const resLen = res.length
	if (resLen > 0 && res.charCodeAt(resLen - 1) !== 47) {
		res += "/"
	}

	return res + p2.slice(start)
}

export function relative(base: string, to: string): string {
	let blen = base.length
	if (blen > 0 && base.charCodeAt(blen - 1) !== 47) blen++
	return to.slice(blen)
}

function strip(path: string): string {
	let res = path
	const idx = path.indexOf("\\")
	if (idx !== -1) {
		res = ""
		let start = 0
		const len = path.length
		for (let i = 0; i < len; i++) {
			if (path.charCodeAt(i) === 92) {
				res += path.slice(start, i) + "/"
				start = i + 1
			}
		}
		res += path.slice(start)
	}
	if (res.length > 1 && res.charCodeAt(1) === 58) res = res.slice(2)
	return res
}

export function dirname(path: string): string {
	if (path === "/" || path === ".") return path
	const len = path.length
	const lastIdx = len - 1
	const endsWithSlash = path.charCodeAt(lastIdx) === 47
	const lastSlash = path.lastIndexOf("/", endsWithSlash ? lastIdx - 1 : lastIdx)

	if (lastSlash === -1) return "."
	if (lastSlash === 0) return "/"
	return path.slice(0, lastSlash)
}
