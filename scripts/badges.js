import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { argv, env, exit } from "node:process"

function runTestSuite(dir, envVar) {
	console.log(`Running tests in ${dir}...`)
	const testProcess = spawnSync("bun", ["test", dir], {
		encoding: "utf8",
		env: { ...env, [envVar]: "1" },
	})

	const output = (testProcess.stdout || "") + (testProcess.stderr || "")
	const passMatch = output.match(/(\d+) pass/)
	const totalMatch = output.match(/Ran (\d+) tests/)

	if (!totalMatch) {
		console.error(`Error: Could not parse total test count from Bun output for ${dir}.`)
		console.error(output)
		exit(1)
	}

	const passed = passMatch ? passMatch[1] : "0"
	const total = totalMatch[1]
	return `${passed}/${total}`
}

function updateBadge() {
	const PACKLIST_DIR = "src/test-npm-packlist/"
	const WILDMATCH_DIR = "src/test-wildmatch/"
	const README_PATH = "README.md"

	const packlistValue = runTestSuite(PACKLIST_DIR, "TEST_PACKLIST")
	const wildmatchValue = runTestSuite(WILDMATCH_DIR, "TEST_WILDMATCH")

	console.log(`npm-packlist Test Results: ${packlistValue}`)
	console.log(`wildmatch Test Results: ${wildmatchValue}`)

	let readmeContent = ""
	try {
		readmeContent = readFileSync(README_PATH, "utf8")
	} catch (cause) {
		console.error(`Error: Could not read ${README_PATH}`, { cause })
		exit(1)
	}

	const packlistRegex =
		/\[!\[npm-packlist-tests\]\(https:\/\/img\.shields\.io\/badge\/npm--packlist-(.*?)-blue\)\]\([^)]*\)/
	const wildmatchRegex =
		/\[!\[wildmatch-tests\]\(https:\/\/img\.shields\.io\/badge\/wildmatch-(.*?)-blue\)\]\([^)]*\)/

	const existingPacklistMatch = readmeContent.match(packlistRegex)
	const oldPacklistValue = existingPacklistMatch
		? decodeURIComponent(existingPacklistMatch[1]).replace(/--/g, "-")
		: null

	const existingWildmatchMatch = readmeContent.match(wildmatchRegex)
	const oldWildmatchValue = existingWildmatchMatch
		? decodeURIComponent(existingWildmatchMatch[1]).replace(/--/g, "-")
		: null

	if (argv.includes("--check")) {
		let mismatch = false
		if (!oldPacklistValue) {
			console.error("npm-packlist-tests badge is missing from README.md")
			mismatch = true
		} else if (packlistValue !== oldPacklistValue) {
			console.error(
				`npm-packlist badge is outdated. Current: ${oldPacklistValue}, Expected: ${packlistValue}`,
			)
			mismatch = true
		}

		if (!oldWildmatchValue) {
			console.error("wildmatch-tests badge is missing from README.md")
			mismatch = true
		} else if (wildmatchValue !== oldWildmatchValue) {
			console.error(
				`wildmatch badge is outdated. Current: ${oldWildmatchValue}, Expected: ${wildmatchValue}`,
			)
			mismatch = true
		}

		if (mismatch) {
			exit(1)
		}

		console.log("All badges are up to date.")
		return
	}

	const encodedPacklistValue = packlistValue.replace(/-/g, "--").replace(/\//g, "%2F")
	const newPacklistBadge = `[![npm-packlist-tests](https://img.shields.io/badge/npm--packlist-${encodedPacklistValue}-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-npm-packlist/)`

	const encodedWildmatchValue = wildmatchValue.replace(/-/g, "--").replace(/\//g, "%2F")
	const newWildmatchBadge = `[![wildmatch-tests](https://img.shields.io/badge/wildmatch-${encodedWildmatchValue}-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-wildmatch/)`

	// Replace packlist badge
	if (packlistRegex.test(readmeContent)) {
		readmeContent = readmeContent.replace(packlistRegex, newPacklistBadge)
	} else {
		console.error("Error: npm-packlist-tests badge not found in README.md")
		exit(1)
	}

	// Insert or replace wildmatch badge
	if (wildmatchRegex.test(readmeContent)) {
		readmeContent = readmeContent.replace(wildmatchRegex, newWildmatchBadge)
	} else {
		// Insert wildmatch badge right after packlist badge
		readmeContent = readmeContent.replace(
			newPacklistBadge,
			`${newPacklistBadge}\n${newWildmatchBadge}`,
		)
	}

	writeFileSync(README_PATH, readmeContent, "utf8")
	console.log(`Successfully updated ${README_PATH} with:`)
	console.log(` - npm-packlist badge value ${packlistValue}`)
	console.log(` - wildmatch badge value ${wildmatchValue}`)
}

updateBadge()
