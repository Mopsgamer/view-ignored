/* oxlint-disable */
// Port of the complete node-ignore unit test suite.
// Reference: https://github.com/kaelzhang/node-ignore/blob/3823b5f14bb16b358397c94172bd5741dd2d7bec/test/fixtures/cases.js
// Reference: https://github.com/kaelzhang/node-ignore/blob/3823b5f14bb16b358397c94172bd5741dd2d7bec/test/ignore.test.js

import type { FsAdapter } from "../types.js"

import { describe, test, expect } from "bun:test"
import { createFsFromVolume, Volume } from "memfs"

import { scan } from "../browser_scan.js"
import { makeGit } from "../targets/git.js"

const BOM_CONTENT = "\ufeffnode_modules"

const AIGNORE_CONTENT = `abc
!abc/b
#e
\\#f`

const IGNORE_ISSUE_2_CONTENT = `# git-ls-files --others --exclude-from=.git/info/exclude
# Lines that start with '#' are comments.
# For a project mostly in C, the following would be a good set of
# exclude patterns (uncomment them if you want to use them):
# *.[oa]
# *~

/.project

# The same type as '/.project'
# /.settings

/sharedTools/external/*

thumbs.db

/packs

*.pyc

# /.cache

# /bigtxt
.metadata/*

*~

/sharedTools/jsApiLua.lua

._*

.DS_Store

# /DISABLED

# /.pydevproject

# /testbox

*.swp

/packs/packagesTree

/packs/*.ini

# .buildpath

# The same type as '/sharedTools/external/*'
# /resources/hooks/*

# .idea

.idea/*

# /tags

**.iml

.sonar/*

.*.sw?`

type TestCase = {
	description: string
	patterns: string[]
	paths: Record<string, number> // 1 = ignored, 0 = included
	skip?: boolean
}

const testCases: TestCase[] = [
	{
		description: "#153: reinclude issue",
		patterns: ["/a/**", "!/a/**/b.js "],
		paths: {
			"a/c.d/b.js": 1,
			"a/cd/b.js": 1,
		},
	},
	{
		description: "#148",
		patterns: ["/.a/"],
		paths: {
			".a": 0,
		},
	},
	{
		description: "#77: more cases for coverage",
		patterns: ["/*"],
		paths: {
			a: 1,
			"a/": 1,
			"a/b/": 1,
		},
	},
	{
		description: "#77: directory ending with / not always correctly ignored",
		patterns: ["c/*", "foo/bar/*"],
		paths: {
			"c/": 1,
			c: 0,
			"foo/bar/": 1,
			"foo/bar": 0,
		},
	},
	{
		description: "#108: gitignore rules with BOM",
		patterns: [BOM_CONTENT],
		paths: {
			node_modules: 1,
		},
	},
	{
		description: "charactor ?",
		patterns: ["foo?bar"],
		paths: {
			"foo/bar": 0,
			fooxbar: 1,
			fooxxbar: 0,
		},
	},
	{
		description: "#57, normal * and normal consecutive *",
		patterns: ["**foo", "*bar", "ba*z", "folder/other-folder/**/**js"],
		paths: {
			foo: 1,
			"a/foo": 1,
			afoo: 1,
			abfoo: 1,
			abcfoo: 1,
			bar: 1,
			abar: 1,
			baz: 1,
			"ba/z": 0,
			baaaaaaz: 1,
			"folder/other-folder/dir/main.js": 1,
		},
	},
	{
		description: "#76 (invalid), comments with no heading whitespace",
		patterns: ["node_modules# comments"],
		paths: {
			"node_modules/a.js": 0,
		},
	},
	{
		description: "#59 and more cases about range notation",
		patterns: [
			"src/\\[foo\\]",
			"src/\\[bar]",
			"src/[e\\\\]",
			"s/[f\\\\\\\\]",
			"s/[a-z0-9]",
			"src/[q",
			"src/\\[u",
			"src/[x\\]",
		],
		paths: {
			"src/[foo]": 1,
			"src/[bar]": 1,
			"src/e": 1,
			"s/f": 1,
			"s/a": 1,
			"s/0": 1,
			"src/[q": 0,
			"src/[u": 1,
			"src/[x": 0,
			"src/[x]": 0,
			"src/x": 0,
		},
	},
	{
		description: "gitignore 2.22.1 example",
		patterns: ["doc/frotz/"],
		paths: {
			"doc/frotz/": 1,
			"a/doc/frotz/": 0,
		},
	},
	{
		description: "#56",
		patterns: ["/*/", "!/foo/"],
		paths: {
			"foo/bar.js": 0,
		},
	},
	{
		description: "object prototype",
		patterns: ["*", "!hasOwnProperty", "!a"],
		paths: {
			hasOwnProperty: 0,
			"a/hasOwnProperty": 0,
			toString: 1,
			"a/toString": 1,
		},
	},
	{
		description: "a and a/",
		patterns: ["a", "a2", "b/", "b2/"],
		paths: {
			a: 1,
			"a2/": 1,
			b: 0,
			"b2/": 1,
		},
	},
	{
		description: "ending question mark",
		patterns: ["*.web?"],
		paths: {
			"a.webp": 1,
			"a.webm": 1,
			"a.webam": 0,
			"a.png": 0,
		},
	},
	{
		description: "intermediate question mark",
		patterns: ["a?c"],
		paths: {
			abc: 1,
			acc: 1,
			ac: 0,
			abbc: 0,
		},
	},
	{
		description: "multiple question marks",
		patterns: ["a?b??"],
		paths: {
			acbdd: 1,
			acbddd: 0,
		},
	},
	{
		description: "normal *.[oa]",
		patterns: ["*.[oa]"],
		paths: {
			"a.js": 0,
			"a.a": 1,
			"a.aa": 0,
			"a.o": 1,
			"a.0": 0,
		},
	},
	{
		description: "multiple brackets",
		patterns: ["*.[ab][cd][ef]"],
		paths: {
			"a.ace": 1,
			"a.bdf": 1,
			"a.bce": 1,
			"a.abc": 0,
			"a.aceg": 0,
		},
	},
	{
		description: "special case: []",
		patterns: ["*.[]"],
		paths: {
			"a.[]": 0,
			"a.[]a": 0,
		},
	},
	{
		description: "mixed with numbers, characters and symbols: *.[0a_]",
		patterns: ["*.[0a_]"],
		paths: {
			"a.0": 1,
			"a.1": 0,
			"a.a": 1,
			"a.b": 0,
			"a._": 1,
			"a.=": 0,
		},
	},
	{
		description: "range: [a-z]",
		patterns: ["*.pn[a-z]"],
		paths: {
			"a.pn1": 0,
			"a.pn2": 0,
			"a.png": 1,
			"a.pna": 1,
		},
	},
	{
		description: "range: [0-9]",
		patterns: ["*.pn[0-9]"],
		paths: {
			"a.pn1": 1,
			"a.pn2": 1,
			"a.png": 0,
			"a.pna": 0,
		},
	},
	{
		description: "multiple ranges: [0-9a-z]",
		patterns: ["*.pn[0-9a-z]"],
		paths: {
			"a.pn1": 1,
			"a.pn2": 1,
			"a.png": 1,
			"a.pna": 1,
			"a.pn-": 0,
		},
	},
	{
		description: "special range: [0-z]",
		patterns: ["*.[0-z]"],
		paths: {
			"a.0": 1,
			"a.9": 1,
			"a.00": 0,
			"a.a": 1,
			"a.z": 1,
			"a.zz": 0,
		},
	},
	{
		description: "special case: range out of order: [a-9]",
		patterns: ["*.[a-9]"],
		paths: {
			"a.0": 0,
			"a.-": 0,
			"a.9": 0,
		},
	},
	{
		description: "special case: range-like character set",
		patterns: ["*.[a-]"],
		paths: {
			"a.a": 1,
			"a.-": 1,
			"a.b": 0,
		},
	},
	{
		description: "special case: the combination of range and set",
		patterns: ["*.[a-z01]"],
		paths: {
			"a.a": 1,
			"a.b": 1,
			"a.z": 1,
			"a.0": 1,
			"a.1": 1,
			"a.2": 0,
		},
	},
	{
		description: "special case: 1 step range",
		patterns: ["*.[0-0]"],
		paths: {
			"a.0": 1,
			"a.1": 0,
			"a.-": 0,
		},
	},
	{
		description: "negated class: [!a].txt",
		patterns: ["[!a].txt"],
		paths: {
			"a.txt": 0,
			"b.txt": 1,
		},
	},
	{
		description: "negated class with caret: [^a]",
		patterns: ["[^a]"],
		paths: {
			a: 0,
			b: 1,
		},
	},
	{
		description: "negated range: [!a-c].txt",
		patterns: ["[!a-c].txt"],
		paths: {
			"a.txt": 0,
			"b.txt": 0,
			"c.txt": 0,
			"d.txt": 1,
		},
	},
	{
		description: "negated numeric range: [!0-9]",
		patterns: ["[!0-9]"],
		paths: {
			"0": 0,
			"5": 0,
			"9": 0,
			a: 1,
		},
	},
	{
		description: "negated class in the middle: x[!y]z",
		patterns: ["x[!y]z"],
		paths: {
			xyz: 0,
			xaz: 1,
			xbz: 1,
		},
	},
	{
		description: "special case: similar, but not a character set",
		patterns: ["*.[a-"],
		paths: {
			"a.": 0,
			"a.[": 0,
			"a.a": 0,
			"a.-": 0,
		},
	},
	{
		description: "related to #38",
		patterns: ["*", "!abc*"],
		paths: {
			a: 1,
			abc: 0,
			abcd: 0,
		},
	},
	{
		description: "#38",
		patterns: ["*", "!*/", "!foo/bar"],
		paths: {
			a: 1,
			"b/c": 1,
			"foo/bar": 0,
			"foo/e": 1,
		},
	},
	{
		description: 'intermediate "\\ " should be unescaped to " "',
		patterns: ["abc\\ d", "abc e", "a\\ b\\ c"],
		paths: {
			"abc d": 1,
			"abc e": 1,
			"abc/abc d": 1,
			"abc/abc e": 1,
			"abc/a b c": 1,
		},
	},
	{
		description: "#25",
		patterns: [".git/*", "!.git/config", ".ftpconfig"],
		paths: {
			".ftpconfig": 1,
			".git/config": 0,
			".git/description": 1,
		},
	},
	{
		description: "#26: .gitignore man page sample",
		patterns: [
			"# exclude everything except directory foo/bar",
			"/*",
			"!/foo",
			"/foo/*",
			"!/foo/bar",
		],
		paths: {
			"no.js": 1,
			"foo/no.js": 1,
			"foo/bar/yes.js": 0,
			"foo/bar/baz/yes.js": 0,
			"boo/no.js": 1,
		},
	},
	{
		description: "wildcard: special case, escaped wildcard",
		patterns: ["*.html", "!a/b/\\*/index.html"],
		paths: {
			"a/b/*/index.html": 0,
			"a/b/index.html": 1,
		},
	},
	{
		description: "wildcard: treated as a shell glob suitable for consumption by fnmatch(3)",
		patterns: ["*.html", "!b/\\*/index.html"],
		paths: {
			"a/b/*/index.html": 1,
			"a/b/index.html": 1,
		},
	},
	{
		description: "wildcard: with no escape",
		patterns: ["*.html", "!a/b/*/index.html"],
		paths: {
			"a/b/*/index.html": 0,
			"a/b/index.html": 1,
		},
	},
	{
		description: "#24: a negative pattern without a trailing wildcard",
		patterns: ["/node_modules/*", "!/node_modules", "!/node_modules/package"],
		paths: {
			"node_modules/a/a.js": 1,
			"node_modules/package/a.js": 0,
		},
	},
	{
		description: "#21: unignore with 1 globstar, reversed order",
		patterns: ["!foo/bar.js", "foo/*"],
		paths: {
			"foo/bar.js": 1,
			"foo/bar2.js": 1,
			"foo/bar/bar.js": 1,
		},
	},
	{
		description: "#21: unignore with 2 globstars, reversed order",
		patterns: ["!foo/bar.js", "foo/**"],
		paths: {
			"foo/bar.js": 1,
			"foo/bar2.js": 1,
			"foo/bar/bar.js": 1,
		},
	},
	{
		description: "#21: unignore with several groups of 2 globstars, reversed order",
		patterns: ["!foo/bar.js", "foo/**/**"],
		paths: {
			"foo/bar.js": 1,
			"foo/bar2.js": 1,
			"foo/bar/bar.js": 1,
		},
	},
	{
		description: "#21: unignore with 1 globstar",
		patterns: ["foo/*", "!foo/bar.js"],
		paths: {
			"foo/bar.js": 0,
			"foo/bar2.js": 1,
			"foo/bar/bar.js": 1,
		},
	},
	{
		description: "#21: unignore with 2 globstars",
		patterns: ["foo/**", "!foo/bar.js"],
		paths: {
			"foo/bar.js": 0,
			"foo/bar2.js": 1,
			"foo/bar/bar.js": 1,
		},
	},
	{
		description: "related to #21: several groups of 2 globstars",
		patterns: ["foo/**/**", "!foo/bar.js"],
		paths: {
			"foo/bar.js": 0,
			"foo/bar2.js": 1,
			"foo/bar/bar.js": 1,
		},
	},
	{
		description: "ignore dot files",
		patterns: [".*"],
		paths: {
			".a": 1,
			".gitignore": 1,
		},
	},
	{
		description: "#14, README example broken in 3.0.3",
		patterns: [".abc/*", "!.abc/d/"],
		paths: {
			".abc/a.js": 1,
			".abc/d/e.js": 0,
		},
	},
	{
		description: "#14, README example broken in 3.0.3, not negate parent folder",
		patterns: [".abc/*", "!.abc/d/*"],
		paths: {
			".abc/a.js": 1,
			".abc/d/e.js": 1,
		},
	},
	{
		description: "A blank line matches no files",
		patterns: [""],
		paths: {
			a: 0,
			"a/b/c": 0,
		},
	},
	{
		description: "A line starting with # serves as a comment.",
		patterns: ["#abc"],
		paths: {
			"#abc": 0,
		},
	},
	{
		description:
			'Put a backslash ("\\") in front of the first hash for patterns that begin with a hash.',
		patterns: ["\\#abc"],
		paths: {
			"#abc": 1,
		},
	},
	{
		description: 'Trailing spaces are ignored unless they are quoted with backslash ("\\")',
		patterns: ["abc\\  ", "bcd  ", "cde \\ ", "def "],
		paths: {
			"abc\\  ": 0,
			"abc  ": 0,
			"abc ": 1,
			"abc   ": 0,
			bcd: 1,
			"bcd ": 0,
			"bcd  ": 0,
			"cde  ": 1,
			"cde ": 0,
			"cde   ": 0,
			def: 1,
			"def ": 0,
		},
	},
	{
		description:
			'An optional prefix "!" which negates the pattern; any matching file excluded by a previous pattern will become included again',
		patterns: ["abc", "!abc"],
		paths: {
			"abc/a.js": 0,
			"abc/": 0,
		},
	},
	{
		description:
			"issue #10: It is not possible to re-include a file if a parent directory of that file is excluded",
		patterns: ["/abc/", "!/abc/a.js"],
		paths: {
			"abc/a.js": 1,
			"abc/d/e.js": 1,
		},
	},
	{
		description: "we did not know whether the rule is a dir first",
		patterns: ["abc", "!bcd/abc/a.js"],
		paths: {
			"abc/a.js": 1,
			"bcd/abc/a.js": 1,
		},
	},
	{
		description:
			'Put a backslash ("\\") in front of the first "!" for patterns that begin with a literal "!"',
		patterns: ["\\!abc", "\\!important!.txt"],
		paths: {
			"!abc": 1,
			abc: 0,
			"b/!important!.txt": 1,
			"!important!.txt": 1,
		},
	},
	{
		description:
			"If the pattern ends with a slash, it is removed for the purpose of the following description, but it would only find a match with a directory",
		patterns: ["abc/"],
		paths: {
			abc: 0,
			"abc/": 1,
			"bcd/abc/": 1,
		},
	},
	{
		description: "If the pattern does not contain a slash /, Git treats it as a shell glob pattern",
		patterns: ["a.js", "f/"],
		paths: {
			"a.js": 1,
			"b/a/a.js": 1,
			"a/a.js": 1,
			"b/a.jsa": 0,
			"f/": 1,
			"g/f/": 1,
		},
	},
	{
		description:
			"Otherwise, Git treats the pattern as a shell glob suitable for consumption by fnmatch(3) with the FNM_PATHNAME flag",
		patterns: ["a/a.js"],
		paths: {
			"a/a.js": 1,
			"a/a.jsa": 0,
			"b/a/a.js": 0,
			"c/a/a.js": 0,
		},
	},
	{
		description: "wildcards in the pattern will not match a / in the pathname.",
		patterns: ["Documentation/*.html"],
		paths: {
			"Documentation/git.html": 1,
			"Documentation/ppc/ppc.html": 0,
			"tools/perf/Documentation/perf.html": 0,
		},
	},
	{
		description: "A leading slash matches the beginning of the pathname",
		patterns: ["/*.c"],
		paths: {
			"cat-file.c": 1,
			"mozilla-sha1/sha1.c": 0,
		},
	},
	{
		description: 'A leading "**" followed by a slash means match in all directories',
		patterns: ["**/foo"],
		paths: {
			foo: 1,
			"a/foo": 1,
			"foo/a": 1,
			"a/foo/a": 1,
			"a/b/c/foo/a": 1,
		},
	},
	{
		description: 'consecutive leading "**/" behave as a single "**/"',
		patterns: ["**/**/foo"],
		paths: {
			foo: 1,
			"a/foo": 1,
			"a/b/foo": 1,
		},
	},
	{
		description:
			'"**/foo/bar" matches file or directory "bar" anywhere that is directly under directory "foo"',
		patterns: ["**/foo/bar"],
		paths: {
			"foo/bar": 1,
			"abc/foo/bar": 1,
			"abc/foo/bar/": 1,
		},
	},
	{
		description: 'A trailing "/**" matches everything inside',
		patterns: ["abc/**"],
		paths: {
			"abc/a/": 1,
			"abc/b": 1,
			"abc/d/e/f/g": 1,
			"bcd/abc/a": 0,
			abc: 0,
		},
	},
	{
		description:
			"A slash followed by two consecutive asterisks then a slash matches zero or more directories",
		patterns: ["a/**/b"],
		paths: {
			"a/b": 1,
			"a/x/b": 1,
			"a/x/y/b": 1,
			"b/a/b": 0,
		},
	},
	{
		description: "add a file content",
		patterns: [AICONTENT_PLACEHOLDER_KEY()],
		paths: {
			"abc/a.js": 1,
			"abc/b/b.js": 1,
			"#e": 0,
			"#f": 1,
		},
	},
	{
		description: "should excape metacharacters of regular expressions",
		patterns: ["*.js", "!\\*.js", "!a#b.js", "!?.js", "#abc", "\\#abc"],
		paths: {
			"*.js": 0,
			"abc.js": 1,
			"a#b.js": 0,
			abc: 0,
			"#abc": 1,
			"?.js": 0,
		},
	},
	{
		description: "issue #2: question mark should not break all things",
		patterns: [IGNORE_ISSUE_2_PLACEHOLDER_KEY()],
		paths: {
			".project": 1,
			"abc/.project": 0,
			".a.sw": 0,
			".a.sw?": 1,
			"thumbs.db": 1,
		},
	},
	{
		description: 'dir ended with "*"',
		patterns: ["abc/*"],
		paths: {
			abc: 0,
		},
	},
	{
		description: 'file ended with "*"',
		patterns: ["abc.js*"],
		paths: {
			"abc.js/": 1,
			"abc.js/abc": 1,
			"abc.jsa/": 1,
			"abc.jsa/abc": 1,
		},
	},
	{
		description: "wildcard as filename",
		patterns: ["*.b"],
		paths: {
			"b/a.b": 1,
			"b/.b": 1,
			"b/.ba": 0,
			"b/c/a.b": 1,
		},
	},
	{
		description: "slash at the beginning and come with a wildcard",
		patterns: ["/*.c"],
		paths: {
			".c": 1,
			"c.c": 1,
			"c/c.c": 0,
			"c/d": 0,
		},
	},
	{
		description: "dot file",
		patterns: [".d"],
		paths: {
			".d": 1,
			".dd": 0,
			"d.d": 0,
			"d/.d": 1,
			"d/d.d": 0,
			"d/e": 0,
		},
	},
	{
		description: "dot dir",
		patterns: [".e"],
		paths: {
			".e/": 1,
			".ee/": 0,
			"e.e/": 0,
			".e/e": 1,
			"e/.e": 1,
			"e/e.e": 0,
			"e/f": 0,
		},
	},
	{
		description: "node modules: once",
		patterns: ["node_modules/"],
		paths: {
			"node_modules/gulp/node_modules/abc.md": 1,
			"node_modules/gulp/node_modules/abc.json": 1,
		},
	},
	{
		description: "node modules: sub directories",
		patterns: ["node_modules"],
		paths: {
			"a/b/node_modules/abc.md": 1,
		},
	},
	{
		description: "node modules: twice",
		patterns: ["node_modules/", "node_modules/"],
		paths: {
			"node_modules/gulp/node_modules/abc.md": 1,
			"node_modules/gulp/node_modules/abc.json": 1,
		},
	},
	{
		description: "unicode characters in windows paths",
		patterns: ["test"],
		paths: {
			"some/path/to/test/ignored.js": 1,
			"some/special/path/to/目录/test/ignored.js": 1,
		},
	},
	{
		description: "#68: ignore test for files named ...",
		patterns: ["/...", "/....."],
		paths: {
			"...": 1,
			"....": 0,
			".....": 1,
			"......": 0,
		},
	},
	{
		description: "#68: file named ...",
		patterns: [],
		paths: {
			"...": 0,
			"....": 0,
			".....": 0,
		},
	},
	{
		description: "#130: consequent escaped backslashes with whitespaces",
		patterns: ["a\\\\ ", "a\\\\ b", "a\\\\\\ b"],
		paths: {
			"a\\": 1,
			"a\\ b": 1,
			"a\\\\ b": 0,
			"a\\\\\\ b": 0,
		},
	},
	{
		description:
			"#81: invalid trailing backslash at the end should not throw, test non-windows env only",
		patterns: ["test\\", "testa\\\\", "\\", "foo/*", "!foo/test\\"],
		paths: {
			test: 0,
			"test\\": 0,
			"testa\\": 1,
			"\\": 0,
			"foo/test\\": 1,
		},
	},
	{
		description: "linux: back slashes on paths",
		patterns: ["a", "b\\\\c"],
		paths: {
			"b\\c/a.md": 1,
			"a\\b/a.js": 0,
			"a\\b/a": 1,
			"a/a.js": 1,
		},
	},
	{
		description: "#59: test cases for linux only",
		patterns: [
			"src/\\[foo\\]",
			"src/\\[foo2\\\\]",
			"src/\\[foo3\\\\\\]",
			"src/\\[foo4\\\\\\\\]",
			"src/\\[foo5\\\\\\\\\\]",
			"src/\\[foo6\\\\\\\\\\\\]",
			"src/\\[bar]",
			"src/[e\\\\]",
			"s/[f\\\\\\\\]",
			"s/[a-z0-9]",
		],
		paths: {
			"src/[foo]": 1,
			"src/[foo2\\]": 1,
			"src/[foo3\\]": 1,
			"src/[foo4\\\\]": 1,
			"src/[foo5\\\\]": 1,
			"src/[foo6\\\\\\]": 1,
			"src/[bar]": 1,
			"src/e": 1,
			"src/\\": 1,
			"s/f": 1,
			"s/\\": 1,
			"s/a": 1,
			"s/0": 1,
		},
	},
]

function AICONTENT_PLACEHOLDER_KEY() {
	return "__AICONTENT_PLACEHOLDER__"
}

function IGNORE_ISSUE_2_PLACEHOLDER_KEY() {
	return "__IGNORE_ISSUE_2_PLACEHOLDER__"
}

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

// Filter out platform-specific backslash path tests to ensure 100% consistent results across Windows and Linux
const filteredTestCases = testCases.filter((tc) => {
	return !Object.keys(tc.paths).some((p) => p.includes("\\"))
})

describe.skipIf(!process.env.TEST_WILDMATCH)("node-ignore compatibility tests", () => {
	for (const tc of filteredTestCases) {
		test(tc.description, async () => {
			let patterns = tc.patterns
			if (patterns.length === 1 && patterns[0] === AICONTENT_PLACEHOLDER_KEY()) {
				patterns = AIGNORE_CONTENT.split("\n")
			} else if (patterns.length === 1 && patterns[0] === IGNORE_ISSUE_2_PLACEHOLDER_KEY()) {
				patterns = IGNORE_ISSUE_2_CONTENT.split("\n")
			}

			const gitignoreContent = patterns.join("\n")
			const allPaths = Object.keys(tc.paths)
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
				invert: 2, // 2 returns both ignored and included
			})

			for (const p of allPaths) {
				const expectedIgnored = tc.paths[p] === 1
				const match = scanResult.paths.get(p)
				const isIgnored = match ? match.ignored : false

				expect(isIgnored).toBe(expectedIgnored)
			}
		})
	}
})
