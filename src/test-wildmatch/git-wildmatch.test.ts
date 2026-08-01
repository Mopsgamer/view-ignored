/* oxlint-disable */
// Port of the complete Git wildmatch unit test suite.
// Reference: https://github.com/git/git/blob/13c7afec212fc97ce257d15601659314c6673d6c/t/t3070-wildmatch.sh

import type { FsAdapter } from "../types.js"

import { describe, test, expect } from "bun:test"
import { createFsFromVolume, Volume } from "memfs"

import { scan } from "../browser_scan.js"
import { makeGit } from "../targets/git.js"

type GitTestCase = {
	match_pathmatch: number | string // 1 = matches, 0 = no match, E = error/skip
	match_pathmatchi: number | string
	text: string
	pattern: string
}

const gitTestCases: GitTestCase[] = [
	// Basic wildmatch features
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo", pattern: "foo" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo", pattern: "bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "", pattern: "" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo", pattern: "???" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo", pattern: "??" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo", pattern: "*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo", pattern: "f*" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo", pattern: "*f" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo", pattern: "*foo*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foobar", pattern: "*ob*a*r*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "aaaaaaabababab", pattern: "*ab" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo*", pattern: "foo\\*" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foobar", pattern: "foo\\*bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "f\\oo", pattern: "f\\\\oo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo\\", pattern: "foo\\" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ball", pattern: "*[al]?" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "ten", pattern: "[ten]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ten", pattern: "**[!te]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "ten", pattern: "**[!ten]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ten", pattern: "t[a-g]n" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "ten", pattern: "t[!a-g]n" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ton", pattern: "t[!a-g]n" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ton", pattern: "t[^a-g]n" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a]b", pattern: "a[]]b" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a-b", pattern: "a[]-]b" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a]b", pattern: "a[]-]b" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "aab", pattern: "a[]-]b" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "aab", pattern: "a[]a-]b" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "]", pattern: "]" },

	// Extended slash-matching features
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/baz/bar", pattern: "foo*bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/baz/bar", pattern: "foo**bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foobazbar", pattern: "foo**bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/baz/bar", pattern: "foo/**/bar" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo/baz/bar", pattern: "foo/**/**/bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/b/a/z/bar", pattern: "foo/**/bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/b/a/z/bar", pattern: "foo/**/**/bar" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo/bar", pattern: "foo/**/bar" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo/bar", pattern: "foo/**/**/bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo?bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo[/]bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo[^a-z]bar" },
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: "foo/bar",
		pattern: "f[^eiu][^eiu][^eiu][^eiu][^eiu]r",
	},
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: "foo-bar",
		pattern: "f[^eiu][^eiu][^eiu][^eiu][^eiu]r",
	},
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo", pattern: "**/foo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "XXX/foo", pattern: "**/foo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "bar/baz/foo", pattern: "**/foo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "bar/baz/foo", pattern: "*/foo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar/baz", pattern: "**/bar*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "deep/foo/bar/baz", pattern: "**/bar/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "deep/foo/bar/baz/", pattern: "**/bar/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "deep/foo/bar/baz/", pattern: "**/bar/**" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "deep/foo/bar", pattern: "**/bar/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "deep/foo/bar/", pattern: "**/bar/**" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar/baz", pattern: "**/bar**" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar/baz/x", pattern: "*/bar/**" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "deep/foo/bar/baz/x", pattern: "*/bar/**" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "deep/foo/bar/baz/x", pattern: "**/bar/*/*" },

	// Various additional tests
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "acrt", pattern: "a[c-c]st" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "acrt", pattern: "a[c-c]rt" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "]", pattern: "[!]-]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a", pattern: "[!]-]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "", pattern: "\\" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "\\", pattern: "\\" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "XXX/\\", pattern: "*/\\" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "XXX/\\", pattern: "*/\\\\" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo", pattern: "foo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "@foo", pattern: "@foo" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo", pattern: "@foo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "[ab]", pattern: "\\[ab]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "[ab]", pattern: "[[]ab]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "[ab]", pattern: "[[:]ab]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "[ab]", pattern: "[[::]ab]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "[ab]", pattern: "[[:digit]ab]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "[ab]", pattern: "[\\[:]ab]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "?a?b", pattern: "\\??\\?b" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "abc", pattern: "\\a\\b\\c" },
	{ match_pathmatch: "E", match_pathmatchi: "E", text: "foo", pattern: "" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar/baz/to", pattern: "**/t[o]" },

	// Character class tests
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: "a1B",
		pattern: "[[:alpha:]][[:digit:]][[:upper:]]",
	},
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "a", pattern: "[[:digit:][:upper:][:space:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "A", pattern: "[[:digit:][:upper:][:space:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "1", pattern: "[[:digit:][:upper:][:space:]]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "1", pattern: "[[:digit:][:upper:][:spaci:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: " ", pattern: "[[:digit:][:upper:][:space:]]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: ".", pattern: "[[:digit:][:upper:][:space:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: ".", pattern: "[[:digit:][:punct:][:space:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "5", pattern: "[[:xdigit:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "f", pattern: "[[:xdigit:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "D", pattern: "[[:xdigit:]]" },
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: "_",
		pattern:
			"[[:alnum:][:alpha:][:blank:][:cntrl:][:digit:][:graph:][:lower:][:print:][:punct:][:space:][:upper:][:xdigit:]]",
	},
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: ".",
		pattern:
			"[^[:alnum:][:alpha:][:blank:][:cntrl:][:digit:][:lower:][:space:][:upper:][:xdigit:]]",
	},
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "5", pattern: "[a-c[:digit:]x-z]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "b", pattern: "[a-c[:digit:]x-z]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "y", pattern: "[a-c[:digit:]x-z]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "q", pattern: "[a-c[:digit:]x-z]" },

	// Additional tests, including some malformed wildmatch patterns
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "]", pattern: "[\\\\-^]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "[", pattern: "[\\\\-^]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[\\-_]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "]", pattern: "[\\]]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "\\]", pattern: "[\\]]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "\\", pattern: "[\\]]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "ab", pattern: "a[]b" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a[]b", pattern: "a[]b" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ab[", pattern: "ab[" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "ab", pattern: "[!" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "ab", pattern: "[-" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[-]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "-", pattern: "[a-" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "-", pattern: "[!a-" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[--A]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "5", pattern: "[--A]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: " ", pattern: "[ --]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "$", pattern: "[ --]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[ --]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "0", pattern: "[ --]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[---]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[------]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "j", pattern: "[a-e-n]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[a-e-n]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a", pattern: "[!------]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "[", pattern: "[]-a]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "^", pattern: "[]-a]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "^", pattern: "[!]-a]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "[", pattern: "[!]-a]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "^", pattern: "[a^bc]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-b]", pattern: "[a-]b]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "\\", pattern: "[\\]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "\\", pattern: "[\\\\]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "\\", pattern: "[!\\\\]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "G", pattern: "[A-\\\\]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "aaabbb", pattern: "b*a" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "aabcaa", pattern: "*ba*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: ",", pattern: "[,]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: ",", pattern: "[\\\\,]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "\\", pattern: "[\\\\,]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "-", pattern: "[,-.]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "+", pattern: "[,-.]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "-.]", pattern: "[,-.]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "2", pattern: "[\\1-\\3]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "3", pattern: "[\\1-\\3]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "4", pattern: "[\\1-\\3]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "\\", pattern: "[[-\\]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "[", pattern: "[[-\\]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "]", pattern: "[[-\\]]" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "-", pattern: "[[-\\]]" },

	// Test recursion
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: "-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1",
		pattern: "-*-*-*-*-*-*-12-*-*-*-m-*-*-*",
	},
	{
		match_pathmatch: 0,
		match_pathmatchi: 0,
		text: "-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1",
		pattern: "-*-*-*-*-*-*-12-*-*-*-m-*-*-*",
	},
	{
		match_pathmatch: 0,
		match_pathmatchi: 0,
		text: "-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1",
		pattern: "-*-*-*-*-*-*-12-*-*-*-m-*-*-*",
	},
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: "XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1",
		pattern: "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*",
	},
	{
		match_pathmatch: 0,
		match_pathmatchi: 0,
		text: "XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1",
		pattern: "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*",
	},
	{
		match_pathmatch: 1,
		match_pathmatchi: 1,
		text: "abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt",
		pattern: "**/*a*b*g*n*t",
	},
	{
		match_pathmatch: 0,
		match_pathmatchi: 0,
		text: "abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz",
		pattern: "**/*a*b*g*n*t",
	},
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo", pattern: "*/*/*" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo/bar", pattern: "*/*/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bba/arr", pattern: "*/*/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bb/aa/rr", pattern: "*/*/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bb/aa/rr", pattern: "**/**/**" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "abcXdefXghi", pattern: "*X*i" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ab/cXd/efXg/hi", pattern: "*X*i" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ab/cXd/efXg/hi", pattern: "*/*X*/*/*i" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ab/cXd/efXg/hi", pattern: "**/*X*/**/*i" },

	// Extra pathmatch tests
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo", pattern: "fo" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo/bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bba/arr", pattern: "foo/*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bba/arr", pattern: "foo/**" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bba/arr", pattern: "foo*" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bba/arr", pattern: "foo**" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bba/arr", pattern: "foo/*arr" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bba/arr", pattern: "foo/**arr" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo/bba/arr", pattern: "foo/*z" },
	{ match_pathmatch: 0, match_pathmatchi: 0, text: "foo/bba/arr", pattern: "foo/**z" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo?bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo[/]bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "foo/bar", pattern: "foo[^a-z]bar" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "ab/cXd/efXg/hi", pattern: "*Xg*i" },

	// Extra case-sensitivity tests
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "a", pattern: "[A-Z]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "A", pattern: "[A-Z]" },
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "A", pattern: "[a-z]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a", pattern: "[a-z]" },
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "a", pattern: "[[:upper:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "A", pattern: "[[:upper:]]" },
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "A", pattern: "[[:lower:]]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a", pattern: "[[:lower:]]" },
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "A", pattern: "[B-Za]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a", pattern: "[B-Za]" },
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "A", pattern: "[B-a]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "a", pattern: "[B-a]" },
	{ match_pathmatch: 0, match_pathmatchi: 1, text: "z", pattern: "[Z-y]" },
	{ match_pathmatch: 1, match_pathmatchi: 1, text: "Z", pattern: "[Z-y]" },
]

function createAdapter(vol: Volume): FsAdapter {
	// oxlint-disable-next-line typescript/no-explicit-any
	const fs = createFsFromVolume(vol) as any
	return {
		readFile: fs.readFile.bind(fs),
		readdir: fs.readdir.bind(fs),
		stat: fs.stat.bind(fs),
	}
}

function buildTree(paths: string[]): any {
	const tree: any = {}
	for (const p of paths) {
		const isDir = p.endsWith("/")
		const cleaned = isDir ? p.slice(0, -1) : p
		const parts = cleaned.split("/")
		let current = tree
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]
			if (part === undefined || part === "") continue
			const isLast = i === parts.length - 1
			if (isLast) {
				if (isDir) {
					current[part] = current[part] || {}
				} else {
					current[part] = ""
				}
			} else {
				current[part] = current[part] || {}
				current = current[part]
			}
		}
	}
	return tree
}

// Filter out platform-specific backslash path tests and unsupported filesystem-unrelated empty/dot paths to ensure 100% consistent results across Windows and Linux
const filteredGitTestCases = gitTestCases.filter((tc) => {
	return !tc.text.includes("\\") && tc.text !== "" && tc.text !== "." && !tc.text.startsWith("./")
})

describe.skipIf(!process.env.TEST_WILDMATCH)("git wildmatch compatibility tests", () => {
	// 1. Case-sensitive pathmatch tests
	for (let i = 0; i < filteredGitTestCases.length; i++) {
		const tc = filteredGitTestCases[i]!
		if (tc.match_pathmatch === "E") continue

		test(`pathmatch case ${i}: text="${tc.text}" pattern="${tc.pattern}"`, async () => {
			const gitignoreContent = tc.pattern
			const allPaths = [tc.text]
			const tree = buildTree(allPaths)
			tree[".gitignore"] = gitignoreContent

			const vol = Volume.fromNestedJSON(tree, "/workspace")
			const adapter = createAdapter(vol)

			const scanResult = await scan({
				cwd: "/workspace",
				fs: adapter,
				target: makeGit(),
				dirs: true,
				depth: Infinity,
				invert: 2,
			})

			const expectedIgnored = tc.match_pathmatch === 1
			const match = scanResult.paths.get(tc.text)
			const isIgnored = match ? match.ignored : false

			expect(isIgnored).toBe(expectedIgnored)
		})
	}

	// 2. Case-insensitive ipathmatch tests
	for (let i = 0; i < filteredGitTestCases.length; i++) {
		const tc = filteredGitTestCases[i]!
		if (tc.match_pathmatchi === "E") continue

		test(`ipathmatch case ${i}: text="${tc.text}" pattern="${tc.pattern}"`, async () => {
			const gitignoreContent = tc.pattern
			const allPaths = [tc.text]
			const tree = buildTree(allPaths)
			tree[".gitignore"] = gitignoreContent

			tree[".git"] = {
				config: "[core]\n\tignorecase = true",
			}

			const vol = Volume.fromNestedJSON(tree, "/workspace")
			const adapter = createAdapter(vol)

			const scanResult = await scan({
				cwd: "/workspace",
				fs: adapter,
				target: makeGit(),
				dirs: true,
				depth: Infinity,
				invert: 2,
			})

			const expectedIgnored = tc.match_pathmatchi === 1
			const match = scanResult.paths.get(tc.text)
			const isIgnored = match ? match.ignored : false

			expect(isIgnored).toBe(expectedIgnored)
		})
	}
})
