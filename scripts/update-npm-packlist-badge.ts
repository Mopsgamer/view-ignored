import { spawnSync } from "bun";
import { readFileSync, writeFileSync } from "fs";

/**
 * Updates the npm-packlist badge in README.md based on the current test results.
 * Uses a marker comment to identify where the badge should be placed.
 */
function updateBadge() {
	const TEST_DIR = "src/test-npm-packlist/";
	const README_PATH = "README.md";
	const MARKER = "<!-- marker: npm-packlist tests -->";

	console.log("Running npm-packlist tests...");
	const testProcess = spawnSync(["bun", "test", TEST_DIR], {
		env: { ...process.env, TEST_PACKLIST: "1" },
		stderr: "pipe",
	});

	const output = testProcess.stdout.toString() + testProcess.stderr.toString();

	// Bun test output format: "X pass", "Y fail", "Ran Z tests"
	const passMatch = output.match(/(\d+) pass/);
	const totalMatch = output.match(/Ran (\d+) tests/);

	if (!totalMatch) {
		console.error("Error: Could not parse total test count from Bun output.");
		process.exit(1);
	}

	const passed = passMatch ? passMatch[1] : "0";
	const total = totalMatch[1];
	const badgeValue = `${passed}/${total}`;

	console.log(`Test Results: ${badgeValue}`);

	let readmeContent = readFileSync(README_PATH, "utf8");
	const markerIndex = readmeContent.indexOf(MARKER);

	if (markerIndex === -1) {
		console.error(`Error: Marker "${MARKER}" not found in ${README_PATH}`);
		process.exit(1);
	}

	const badgeRegex = /\[!\[npm-packlist-tests\].*?\]\(.*?\)/;
	const newBadge = `[![npm-packlist-tests](https://img.shields.io/badge/npm--packlist-${badgeValue.replace(/-/g, "--")}-blue)](src/test-npm-packlist/)`;

	const markerEndIndex = markerIndex + MARKER.length;
	// Always trim any leading/trailing whitespace from rest of file to control spacing precisely
	const restOfFile = readmeContent.substring(markerEndIndex).trimStart();

	if (badgeRegex.test(restOfFile)) {
		const updatedRest = restOfFile.replace(badgeRegex, newBadge);
		// Ensure exactly one newline between marker and badge
		const updatedContent = readmeContent.substring(0, markerEndIndex) + "\n" + updatedRest;

		writeFileSync(README_PATH, updatedContent);
		console.log(`Successfully updated ${README_PATH} with badge value ${badgeValue}`);
	} else {
		console.error("Error: Could not find existing badge following the marker.");
		process.exit(1);
	}
}

updateBadge();
