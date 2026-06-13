import { test, describe } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeGit } from "./git.js"

describe("Git", () => {
	test("empty for empty", async (done) => {
		await testScan(done, { ".": null }, [], { target: makeGit() })
	})

	test("includes for no sources", async (done) => {
		await testScan(done, { file: "" }, ["file"], { target: makeGit() })
	})

	test("keeps for empty source", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "",
				file: "",
			},
			["file", ".gitignore"],
			{ target: makeGit() },
		)
	})

	test("ignores .git/", async (done) => {
		await testScan(
			done,
			{
				".git/HEAD": "",
				".gitignore": "",
				file: "",
			},
			["file", ".gitignore"],
			{ target: makeGit() },
		)
	})

	test("ignores filei (.git/info/exclude)", async (done) => {
		await testScan(
			done,
			{
				".git/info/exclude": "filei",
				file: "",
				filei: "",
			},
			["file"],
			{ target: makeGit() },
		)
	})

	test("ignores filei", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "filei",
				filei: "",
			},
			[".gitignore"],
			{ target: makeGit() },
		)
	})

	test("includes file (case File no match)", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "File",
				file: "",
			},
			[".gitignore", "file"],
			{ target: makeGit() },
		)
	})

	test("ignores multiple files", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "file1.txt\nfile2.txt",
				"file1.txt": "",
				"file2.txt": "",
			},
			[".gitignore"],
			{ target: makeGit() },
		)
	})

	test("ignores files with pattern", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "*.js",
				"bar.js": "",
				"foo.js": "",
			},
			[".gitignore"],
			{ target: makeGit() },
		)
	})

	test("ignores files in subdirectory", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "src/",
				out: {
					"helper.js": "",
					"main.js": "",
				},
				src: {
					"helper.js": "",
					"main.js": "",
				},
			},
			[".gitignore", "out/", "out/main.js", "out/helper.js"],
			{ target: makeGit() },
		)
	})

	test("does not ignore files not matching pattern", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "*.js",
				"bar.js": "",
				"foo.txt": "",
			},
			["foo.txt", ".gitignore"],
			{ target: makeGit() },
		)
	})

	test("negation pattern keeps file", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "*.js\n!negkeep.js",
				"foo.js": "",
				"negkeep.js": "",
			},
			["negkeep.js", ".gitignore"],
			{ target: makeGit() },
		)
	})

	test("exclude works together with .gitignore", async (done) => {
		await testScan(
			done,
			{
				".git/info/exclude": "file_gitinfoex",
				".gitignore": "file_gitignore",
				file_gitignore: "",
				file_gitinfoex: "",
				file_keep: "",
			},
			[".gitignore", "file_keep"],
			{ target: makeGit() },
		)
	})

	test("gitignore has higher priority than exclude", async (done) => {
		await testScan(
			done,
			{
				".git/info/exclude": "file\n!file",
				".gitignore": "file",
				file: "",
			},
			[".gitignore"],
			{ target: makeGit() },
		)
	})

	test("respects .git/info/exclude when scanning with within", async () => {
		await new Promise<void>((done) =>
			testScan(
				done,
				{
					".git": {
						info: {
							exclude: "ignored_file",
						},
					},
					subdir: {
						ignored_file: "",
						kept_file: "",
					},
				},
				["subdir/", "subdir/kept_file"],
				{ target: makeGit(), within: "subdir" },
			),
		)
	})

	test("respects .git/info/exclude when scanning with within (.)", async () => {
		await new Promise<void>((done) =>
			testScan(
				done,
				{
					".git": {
						info: {
							exclude: "ignored_file",
						},
					},
					ignored_file: "",
					kept_file: "",
				},
				["kept_file"],
				{ target: makeGit(), within: "." },
			),
		)
	})

	test("respects .git/info/exclude when scanning with within (./)", async () => {
		await new Promise<void>((done) =>
			testScan(
				done,
				{
					".git": {
						info: {
							exclude: "ignored_file",
						},
					},
					ignored_file: "",
					kept_file: "",
				},
				["kept_file"],
				{ target: makeGit(), within: "./" },
			),
		)
	})

	test("respects .git/info/exclude when scanning with within (./subdir)", async () => {
		await new Promise<void>((done) =>
			testScan(
				done,
				{
					".git": {
						info: {
							exclude: "ignored_file",
						},
					},
					subdir: {
						ignored_file: "",
						kept_file: "",
					},
				},
				["subdir/", "subdir/kept_file"],
				{ target: makeGit(), within: "./subdir" },
			),
		)
	})

	test("respects .git/info/exclude when scanning with within (subdir/)", async () => {
		await new Promise<void>((done) =>
			testScan(
				done,
				{
					".git": {
						info: {
							exclude: "ignored_file",
						},
					},
					subdir: {
						ignored_file: "",
						kept_file: "",
					},
				},
				["subdir/", "subdir/kept_file"],
				{ target: makeGit(), within: "subdir/" },
			),
		)
	})

	test("respects .git/info/exclude when scanning with within (nested)", async () => {
		await new Promise<void>((done) =>
			testScan(
				done,
				{
					".git": {
						info: {
							exclude: "ignored_file",
						},
					},
					subdir: {
						subsubdir: {
							ignored_file: "",
							kept_file: "",
						},
					},
				},
				["subdir/subsubdir/", "subdir/subsubdir/kept_file"],
				{ target: makeGit(), within: "subdir/subsubdir" },
			),
		)
	})

	test("respects .git/info/exclude when scanning with within (nested, with depth)", async () => {
		await new Promise<void>((done) =>
			testScan(
				done,
				{
					".git": {
						info: {
							exclude: "ignored_file",
						},
					},
					subdir: {
						subsubdir: {
							ignored_file: "",
							kept_file: "",
						},
					},
				},
				["subdir/subsubdir/", "subdir/subsubdir/kept_file"],
				{ depth: 2, target: makeGit(), within: "subdir/subsubdir" },
			),
		)
	})

	test("within depth 0", async (done) => {
		await testScan(
			done,
			{
				subdir: {
					file: "",
				},
			},
			["subdir/", "subdir/file"],
			{ depth: 0, target: makeGit(), within: "subdir" },
		)
	})

	test("within nested depth 1", async (done) => {
		await testScan(
			done,
			{
				a: {
					b: {
						file: "",
					},
				},
			},
			["a/b/", "a/b/file"],
			{ depth: 1, target: makeGit(), within: "a/b" },
		)
	})
})
