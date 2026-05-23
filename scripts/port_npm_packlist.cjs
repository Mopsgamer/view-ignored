const fs = require("fs")
const path = require("path")

const testDir = "temp_npm_packlist/test"
const outputDir = "src/npm-packlist"
const commit = "79d3761d6ab491ceeb192e2b88d0853d57048768"

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true })
}

function extractBalanced(str, startChar, endChar) {
	let depth = 0
	let result = ""
	let started = false
	for (let i = 0; i < str.length; i++) {
		if (str[i] === startChar) {
			depth++
			started = true
		}
		if (started) result += str[i]
		if (str[i] === endChar) {
			depth--
			if (started && depth === 0) return result
		}
	}
	return null
}

function getLineNumber(content, index) {
	return content.substring(0, index).split("\n").length
}

const files = fs
	.readdirSync(testDir)
	.filter((f) => f.endsWith(".js") && !["bin.js", "callbacks.js", "constructor.js"].includes(f))

for (const file of files) {
	let content = fs.readFileSync(path.join(testDir, file), "utf8")
	const testName = file.replace(".js", "")

	// Scrub local definitions
	content = content.replace(/const elfJS = [\s\S]*?`[\s\S]*?`/g, "")
	content = content.replace(/const elfJS = ".*?";/g, "")
	content = content.replace(/const bin = ".*?";/g, "")

	const testCases = []
	const tTests = content.split(/t\.test\s*\(/)
	const prefix = tTests.shift()

	const topLevelTdStart = prefix.indexOf("t.testdir(")
	const topLevelTd =
		topLevelTdStart !== -1
			? {
					line: getLineNumber(content, topLevelTdStart),
					tree: extractBalanced(prefix.slice(topLevelTdStart + 9), "{", "}"),
				}
			: null

	if (tTests.length === 0) {
		const tsStart = content.indexOf("t.same(files,")
		const tdStart = content.indexOf("t.testdir(")
		const tree =
			tdStart !== -1
				? extractBalanced(content.slice(tdStart + 9), "{", "}")
				: topLevelTd
					? topLevelTd.tree
					: null
		const expected = tsStart !== -1 ? extractBalanced(content.slice(tsStart + 13), "[", "]") : null
		if (tree && expected) {
			testCases.push({
				expected,
				line: tdStart !== -1 ? getLineNumber(content, tdStart) : topLevelTd ? topLevelTd.line : 0,
				title: "follows npm package ignoring rules",
				tree,
			})
		}
	} else {
		let currentPos = prefix.length
		for (const tTest of tTests) {
			const fullTTest = "t.test(" + tTest
			const titleMatch = tTest.match(/^(['"])(.*?)\1/)
			if (!titleMatch) continue
			const title = titleMatch[2]

			const tdStart = tTest.indexOf("t.testdir(")
			const tsStart = tTest.indexOf("t.same(files,")

			const tree =
				tdStart !== -1
					? extractBalanced(tTest.slice(tdStart + 9), "{", "}")
					: topLevelTd
						? topLevelTd.tree
						: null
			const expected = tsStart !== -1 ? extractBalanced(tTest.slice(tsStart + 13), "[", "]") : null

			if (tree && expected) {
				testCases.push({
					expected,
					line: getLineNumber(content, content.indexOf(fullTTest, currentPos)),
					title,
					tree,
				})
			}
			currentPos += fullTTest.length
		}
	}

	if (testCases.length > 0) {
		const allTrees = testCases.map((tc) => tc.tree).join("\n")
		const imports = []
		if (allTrees.includes("elfJS")) imports.push("elfJS")
		if (allTrees.match(/:\s*bin([,}\s]|$)/)) imports.push("bin")

		let output = `/* eslint-disable sort-keys */\n`
		output += `import { describe, test } from "bun:test"\n\n`
		output += `import { runPacklistTest } from "./runPacklistTest.js"\n`
		if (imports.length > 0) {
			output += `import { ${imports.join(", ")} } from "../test-utils.js"\n`
		}
		output += `\ndescribe("${testName}", () => {\n`
		for (const tc of testCases) {
			let tree = tc.tree.trim()
			let expected = tc.expected.trim()
			tree = tree.replace(/t\.fixture\('symlink',\s*(.*?)\)/g, "{ isSymlink: true, path: $1 }")
			tree = tree.replace(/t\.fixture\("symlink",\s*(.*?)\)/g, "{ isSymlink: true, path: $1 }")
			let options = "{}"
			if (tree.includes("pkg: {") && tree.includes("history: {")) options = '{ cwd: "pkg" }'

			output += `	// https://github.com/npm/npm-packlist/blob/${commit}/test/${file}#L${tc.line}\n`
			output += `	test("${tc.title}", () =>\n`
			output += `		runPacklistTest(\n`
			output += `			${tree},\n`
			output += `			${expected},\n`
			output += `			${options},\n`
			output += `		),\n`
			output += `	)\n`
		}
		output += "})\n"
		fs.writeFileSync(path.join(outputDir, `${testName}.test.ts`), output)
	}
}
