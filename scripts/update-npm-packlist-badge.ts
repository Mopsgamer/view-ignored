import { spawnSync } from "bun"
import { readFileSync, writeFileSync } from "fs"

/**
 * Updates the npm-packlist badge in README.md based on the current test results.
 * Uses a marker comment to identify where the badge should be placed.
 * Ensures strict formatting and URL encoding.
 */
function updateBadge() {
	const TEST_DIR = "src/test-npm-packlist/"
	const README_PATH = "README.md"
	const MARKER = "<!-- marker: npm-packlist tests -->"

	console.log("Running npm-packlist tests...")
	const testProcess = spawnSync(["bun", "test", TEST_DIR], {
		env: { ...process.env, TEST_PACKLIST: "1" },
		stderr: "pipe",
	})

	const output = (testProcess.stdout?.toString() || "") + (testProcess.stderr?.toString() || "")

	// Bun test output format: "X pass", "Y fail", "Ran Z tests"
	const passMatch = output.match(/(\d+) pass/)
	const totalMatch = output.match(/Ran (\d+) tests/)

	if (!totalMatch) {
		console.error("Error: Could not parse total test count from Bun output.")
		process.exit(1)
	}

	const passed = passMatch ? passMatch[1] : "0"
	const total = totalMatch[1]
	const badgeValue = `${passed}/${total}`

	console.log(`Test Results: ${badgeValue}`)

	const readmeContent = readFileSync(README_PATH, "utf8")
	const markerIndex = readmeContent.indexOf(MARKER)

	if (markerIndex === -1) {
		console.error(`Error: Marker "${MARKER}" not found in ${README_PATH}`)
		process.exit(1)
	}

	// URL encode the slash for Shields.io
	const encodedBadgeValue = badgeValue.replace(/-/g, "--").replace(/\//g, "%2F")
	const newBadge = `[![npm-packlist-tests](https://img.shields.io/badge/npm--packlist-${encodedBadgeValue}-blue)](src/test-npm-packlist/)`

	const markerLineEnd = readmeContent.indexOf("\n", markerIndex)
	const beforeMarkerLine = readmeContent.substring(0, markerLineEnd + 1)
	const afterMarkerLine = readmeContent.substring(markerLineEnd + 1).trimStart()

	// Replace the badge and ensure exactly one newline after marker and exactly one newline after badge
	const badgeRegex = /\[!\[npm-packlist-tests\].*?\]\(.*?\)/

	let finalAfterMarker: string
	if (badgeRegex.test(afterMarkerLine)) {
		finalAfterMarker = afterMarkerLine.replace(badgeRegex, newBadge)
	} else {
		finalAfterMarker = newBadge + "\n\n" + afterMarkerLine
	}

	writeFileSync(README_PATH, beforeMarkerLine + finalAfterMarker)
	console.log(`Successfully updated ${README_PATH} with badge value ${badgeValue}`)
}

updateBadge()
