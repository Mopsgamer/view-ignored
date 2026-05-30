import fs from "node:fs"
import { parseArgs } from "node:util"

const { values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		"body-file": { type: "string" },
		"no-ts-changes": { type: "boolean" },
		owner: { type: "string" },
		pr: { type: "string" },
		repo: { type: "string" },
		token: { type: "string" },
	},
})

const { token, pr, owner, repo, "no-ts-changes": noTsChanges, "body-file": bodyFile } = values

if (!token || !pr || !owner || !repo) {
	console.error("Missing required arguments")
	process.exit(1)
}

const API_URL = "https://api.github.com"
const GRAPHQL_URL = "https://api.github.com/graphql"
const headers = {
	Accept: "application/vnd.github.v3+json",
	Authorization: `token ${token}`,
	"User-Agent": "Bun-Comment-Script",
}

const commentHeader = "## Speed Regression Report"

async function main() {
	// List comments
	const listRes = await fetch(`${API_URL}/repos/${owner}/${repo}/issues/${pr}/comments`, {
		headers,
	})
	if (!listRes.ok) {
		console.error("Failed to list comments:", await listRes.text())
		process.exit(1)
	}
	const comments = await listRes.json()
	const botComment = comments.find((c) => c.body.includes(commentHeader))

	if (noTsChanges) {
		if (botComment) {
			console.log("No TS changes, minimizing existing comment...")
			const query = `
				mutation($id: ID!) {
					minimizeComment(input: { subjectId: $id, classifier: OFF_TOPIC }) {
						minimizedComment { isMinimized }
					}
				}
			`
			const res = await fetch(GRAPHQL_URL, {
				body: JSON.stringify({ query, variables: { id: botComment.node_id } }),
				headers,
				method: "POST",
			})
			if (!res.ok) console.error("Failed to minimize:", await res.text())
		}
		return
	}

	const body = fs.readFileSync(bodyFile, "utf8")
	const fullBody = `${commentHeader}\n\n${body}`

	if (botComment) {
		console.log("Updating existing comment...")
		const updateRes = await fetch(
			`${API_URL}/repos/${owner}/${repo}/issues/comments/${botComment.id}`,
			{
				body: JSON.stringify({ body: fullBody }),
				headers,
				method: "PATCH",
			},
		)
		if (!updateRes.ok) console.error("Failed to update comment:", await updateRes.text())

		console.log("Unminimizing comment...")
		const query = `
			mutation($id: ID!) {
				unminimizeComment(input: { subjectId: $id }) {
					unminimizedComment { isMinimized }
				}
			}
		`
		const gqlRes = await fetch(GRAPHQL_URL, {
			body: JSON.stringify({ query, variables: { id: botComment.node_id } }),
			headers,
			method: "POST",
		})
		if (!gqlRes.ok) console.error("Failed to unminimize:", await gqlRes.text())
	} else {
		console.log("Creating new comment...")
		const createRes = await fetch(`${API_URL}/repos/${owner}/${repo}/issues/${pr}/comments`, {
			body: JSON.stringify({ body: fullBody }),
			headers,
			method: "POST",
		})
		if (!createRes.ok) console.error("Failed to create comment:", await createRes.text())
	}
}

main().catch(console.error)
