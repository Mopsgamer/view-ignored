import type { PatternCompileOptions, PatternList, PatternListCompiled } from "./patternList.js"

const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g

const POSIX_CLASSES: Record<string, string> = {
	alnum: "a-zA-Z0-9",
	alpha: "a-zA-Z",
	blank: " \\t",
	cntrl: "\\x00-\\x1f\\x7f",
	digit: "0-9",
	graph: "\\x21-\\x7e",
	lower: "a-z",
	print: "\\x20-\\x7e",
	punct: "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_`{|}~",
	space: "\\s",
	upper: "A-Z",
	xdigit: "0-9a-fA-F",
}

function parseEscapedInBracket(
	pattern: string,
	pos: number,
	closeIdx: number,
	classBody: string,
): { appended: string; newPos: number } {
	const nextPos = pos + 1
	if (nextPos >= closeIdx) return { appended: "\\\\", newPos: nextPos }

	const nextC = pattern[nextPos]!
	if (nextC === "-") {
		const rest = pattern.slice(nextPos + 1, closeIdx)
		const isRange = classBody.endsWith("-") || rest.startsWith("-") || rest.startsWith("\\-")
		return { appended: isRange ? "-" : "\\-", newPos: nextPos + 1 }
	}

	if (nextC === "]" || nextC === "\\" || nextC === "^") {
		return { appended: "\\" + nextC, newPos: nextPos + 1 }
	}

	return { appended: nextC.replace(REGEX_SPECIAL_CHARS, "\\$&"), newPos: nextPos + 1 }
}

/**
 * Parses a bracket expression `[...]` starting at index `startIdx` in `pattern`.
 * Returns `{ source: string, nextIdx: number }` if valid bracket, or `null` if unclosed/invalid.
 */
function parseBracket(
	pattern: string,
	startIdx: number,
): { source: string; nextIdx: number } | null {
	const len = pattern.length
	let i = startIdx + 1 // skip opening '['

	if (i >= len) return null

	let negated = false
	if (pattern[i] === "!" || pattern[i] === "^") {
		negated = true
		i++
	}

	if (i >= len) return null

	// Finding the closing ']'
	// ']' can be literal if it's the first character in the set (after [ or [! / [^)
	let closeIdx = -1
	let scan = i
	if (scan < len && pattern[scan] === "]") scan++ // skip literal ] at start of set

	while (scan < len) {
		if (pattern[scan] === "\\") {
			scan += 2
			continue
		}
		if (pattern[scan] === "[" && pattern[scan + 1] === ":") {
			const posixEnd = pattern.indexOf(":]", scan + 2)
			if (posixEnd !== -1) {
				const className = pattern.slice(scan + 2, posixEnd)
				if (!(className in POSIX_CLASSES)) {
					// Invalid POSIX class name makes the bracket expression invalid
					return null
				}
				scan = posixEnd + 2
				continue
			}
		}
		if (pattern[scan] === "]") {
			closeIdx = scan
			break
		}
		scan++
	}

	if (closeIdx === -1) return null

	// Parse contents between i and closeIdx
	let classBody = ""
	let pos = i

	while (pos < closeIdx) {
		// Check for POSIX class [:class:]
		if (pattern[pos] === "[" && pattern[pos + 1] === ":" && closeIdx - pos >= 4) {
			const endPosix = pattern.indexOf(":]", pos + 2)
			if (endPosix !== -1 && endPosix < closeIdx) {
				const className = pattern.slice(pos + 2, endPosix)
				if (className in POSIX_CLASSES) {
					classBody += POSIX_CLASSES[className]
					pos = endPosix + 2
					continue
				}
				return null
			}
		}

		const c = pattern[pos]!

		if (c === "\\") {
			const res = parseEscapedInBracket(pattern, pos, closeIdx, classBody)
			classBody += res.appended
			pos = res.newPos
			continue
		}

		if (c === "-") {
			const isAtStart = pos === i
			const isAtEnd = pos === closeIdx - 1
			if (isAtStart || isAtEnd) {
				classBody += "\\-"
			} else {
				const prevChar = pattern.charCodeAt(pos - 1)
				const nextChar = pattern.charCodeAt(pos + 1)
				if (prevChar > nextChar) return null
				classBody += "-"
			}
			pos++
			continue
		}

		if (c === "]") {
			classBody += "\\]"
			pos++
			continue
		}

		if (c === "^") {
			classBody += "\\^"
			pos++
			continue
		}

		classBody += c.replace(REGEX_SPECIAL_CHARS, "\\$&")
		pos++
	}

	// In WM_PATHNAME, negated character sets must explicitly exclude /
	const source = negated ? `[^/${classBody}]` : `[${classBody}]`
	return { nextIdx: closeIdx + 1, source }
}

/**
 * Converts a wildmatch pattern to regex source string under WM_PATHNAME / gitignore semantics.
 */
function wildmatchToRegexpSource(pattern: string): string {
	const isRoot = pattern.startsWith("/")
	const isRelative = pattern.startsWith("./")

	let cleaned = pattern
	if (isRelative) cleaned = cleaned.slice(2)

	// Strip all consecutive leading **/ - leading **/ means match anywhere (unanchored)
	let hasLeadingGlobstar = false
	while (cleaned.startsWith("**/")) {
		cleaned = cleaned.slice(3)
		hasLeadingGlobstar = true
	}

	const hasTrailingSlash = cleaned.length > 0 && cleaned.charCodeAt(cleaned.length - 1) === 47
	if (hasTrailingSlash) {
		cleaned = cleaned.slice(0, -1)
	}
	if (isRoot && cleaned.startsWith("/")) {
		cleaned = cleaned.slice(1)
	}

	// Standalone ** matches everything
	if (cleaned === "**" || pattern === "**") {
		return ".*"
	}

	// Anchored if starts with '/' or './' or has a slash anywhere in middle (unless unanchored by leading **/)
	const isAnchored = (isRoot || isRelative || cleaned.includes("/")) && !hasLeadingGlobstar

	let res = ""
	const len = cleaned.length
	let i = 0

	while (i < len) {
		const c = cleaned[i]!

		if (c === "\\") {
			i++
			if (i < len) {
				res += cleaned[i]!.replace(REGEX_SPECIAL_CHARS, "\\$&")
			} else {
				res += "\\\\"
			}
			i++
			continue
		}

		if (c === "[") {
			const bracketResult = parseBracket(cleaned, i)
			if (bracketResult !== null) {
				res += bracketResult.source
				i = bracketResult.nextIdx
				continue
			}
			res += "\\["
			i++
			continue
		}

		if (c === "?") {
			res += "[^/]"
			i++
			continue
		}

		if (c === "/") {
			// Check if followed by **
			if (i + 2 < len && cleaned[i + 1] === "*" && cleaned[i + 2] === "*") {
				const isAtEnd = i + 3 === len
				const isSlashAfter = i + 3 < len && cleaned[i + 3] === "/"
				if (isSlashAfter) {
					res += "(?:/[^/]+)*"
					i += 3 // consume '/**'
					continue
				}
				if (isAtEnd) {
					res += "(?:/.*)?"
					i += 3 // consume '/**'
					continue
				}
			}
			res += "/"
			i++
			continue
		}

		if (c === "*") {
			// Check for globstar **
			if (i + 1 < len && cleaned[i + 1] === "*") {
				const isSlashBefore = i > 0 && cleaned[i - 1] === "/"
				const isSlashAfter = i + 2 < len && cleaned[i + 2] === "/"
				const isAtEnd = i + 2 === len

				if (isSlashBefore && isSlashAfter) {
					// /**/
					res += "(?:/[^/]+)*"
					i += 3 // consume '**/'
					continue
				}

				if (isSlashBefore && isAtEnd) {
					// /**
					res += "(?:/.*)?"
					i += 2 // consume '**'
					continue
				}

				res += "[^/]*"
				i += 2
				continue
			}

			res += "[^/]*"
			i++
			continue
		}

		res += c.replace(REGEX_SPECIAL_CHARS, "\\$&")
		i++
	}

	let prefix = "(?:^|\\/)"
	if (hasLeadingGlobstar) {
		prefix = "(?:^|.*\\/)"
	} else if (isAnchored) {
		prefix = "^"
	}
	const suffix = "(?:\\/|$)"
	return prefix + res + suffix
}

/**
 * Compiles a list of wildmatch patterns into a single matcher object.
 */
export function wildmatchCompile(
	options: PatternCompileOptions & { list: PatternList },
): PatternListCompiled {
	const nocase = !!options.nocase
	const { list } = options
	const len = list.length

	if (len === 0) throw new TypeError("Empty pattern is useless and wastes memory")

	const patternSources: string[] = new Array(len)
	for (let i = 0; i < len; i++) {
		patternSources[i] = wildmatchToRegexpSource(list[i]!)
	}

	const combinedSource = patternSources.map((p) => `(?:${p})`).join("|")
	let combinedRegex: RegExp
	try {
		combinedRegex = new RegExp(combinedSource, nocase ? "i" : "")
	} catch {
		// Fallback for invalid combined pattern sources
		combinedRegex = /(?!)/
	}

	const compiledItems = patternSources.map((s) => new RegExp(s, nocase ? "i" : ""))

	return {
		compiledItems,
		list,
		re: combinedRegex,
	}
}
