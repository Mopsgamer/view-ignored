import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { argv, env, exit } from "node:process"

function updateBadge() {
	const TEST_DIR = "src/test-npm-packlist/"
	const README_PATH = "README.md"
	const MARKER =
		"[![speed-fast](https://img.shields.io/badge/speed-fast-salad?repo=Mopsgamer/view-ignored.svg)](https://github.com/Mopsgamer/view-ignored/tree/main/benchmarks)"

	console.log("Running npm-packlist tests...")
	const testProcess = spawnSync("bun", ["test", TEST_DIR], {
		encoding: "utf8",
		env: { ...env, TEST_PACKLIST: "1" },
	})

	const output = (testProcess.stdout || "") + (testProcess.stderr || "")
	const passMatch = output.match(/(\d+) pass/)
	const totalMatch = output.match(/Ran (\d+) tests/)

	if (!totalMatch) {
		console.error("Error: Could not parse total test count from Bun output.")
		exit(1)
	}

	const passed = passMatch ? passMatch[1] : "0"
	const total = totalMatch[1]
	const badgeValue = `${passed}/${total}`
	console.log(`Test Results: ${badgeValue}`)

	let readmeContent = ""
	try {
		readmeContent = readFileSync(README_PATH, "utf8")
	} catch (cause) {
		console.error(`Error: Could not read ${README_PATH}`, { cause })
		exit(1)
	}

	const badgeRegex =
		/\[!\[npm-packlist-tests\]\(https:\/\/img\.shields\.io\/badge\/npm--packlist-(.*?)-blue\)\]\([^)]*\)/
	const existingMatch = readmeContent.match(badgeRegex)
	const oldBadgeValue = existingMatch
		? decodeURIComponent(existingMatch[1]).replace(/--/g, "-")
		: null

	if (argv.includes("--check")) {
		if (!oldBadgeValue) {
			console.error("Badge is missing from README.md")
			exit(1)
		}
		if (badgeValue !== oldBadgeValue) {
			console.error(`Badge is outdated. Current: ${oldBadgeValue}, Expected: ${badgeValue}`)
			exit(1)
		}
		console.log("Badge is up to date.")
		return
	}

	const encodedValue = badgeValue.replace(/-/g, "--").replace(/\//g, "%2F")
	const newBadge = `[![npm-packlist-tests](https://img.shields.io/badge/npm--packlist-${encodedValue}-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-npm-packlist/)`

	if (badgeRegex.test(readmeContent)) {
		readmeContent = readmeContent.replace(badgeRegex, newBadge)
	} else {
		if (!readmeContent.includes(MARKER)) {
			console.error(`Error: Marker badge not found in ${README_PATH}`)
			exit(1)
		}
		readmeContent = readmeContent.replace(MARKER, `${MARKER}\n${newBadge}`)
	}

	writeFileSync(README_PATH, readmeContent, "utf8")
	console.log(`Successfully updated ${README_PATH} with badge value ${badgeValue}`)
}

updateBadge()
