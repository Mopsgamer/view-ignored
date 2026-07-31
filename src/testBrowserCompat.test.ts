import { describe, test, expect } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"

const nodeBuiltins = new Set([
	"assert",
	"async_hooks",
	"buffer",
	"child_process",
	"cluster",
	"console",
	"constants",
	"crypto",
	"dgram",
	"diagnostics_channel",
	"dns",
	"domain",
	"events",
	"fs",
	"http",
	"http2",
	"https",
	"inspector",
	"module",
	"net",
	"os",
	"path",
	"perf_hooks",
	"process",
	"punycode",
	"querystring",
	"readline",
	"repl",
	"stream",
	"string_decoder",
	"sys",
	"timers",
	"tls",
	"trace_events",
	"tty",
	"url",
	"util",
	"v8",
	"vm",
	"wasi",
	"worker_threads",
	"zlib",
])

function getAllFiles(dir: string): string[] {
	const results: string[] = []
	const list = fs.readdirSync(dir)
	for (const file of list) {
		const filePath = path.join(dir, file)
		const stat = fs.statSync(filePath)
		if (stat.isDirectory()) {
			results.push(...getAllFiles(filePath))
		} else if (file.endsWith(".js")) {
			results.push(filePath)
		}
	}
	return results
}

describe("Browser API Compatibility", () => {
	test("compiled browser files never import Node.js built-ins or use unguarded Node globals", () => {
		const outDir = path.resolve("out")
		const files = getAllFiles(outDir).filter((file) => {
			const relative = path.relative(outDir, file).replace(/\\/g, "/")
			return relative !== "scan.js" && relative !== "stream.js" && !relative.startsWith("cli/")
		})

		expect(files.length).toBeGreaterThan(0)

		const importRegexes = [
			/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
			/import\s+['"]([^'"]+)['"]/g,
			/export\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
			/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
			/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
		]

		for (const file of files) {
			const content = fs.readFileSync(file, "utf8")

			for (const regex of importRegexes) {
				let match
				while ((match = regex.exec(content)) !== null) {
					const importSource = match[1]!
					const isNodeBuiltin = importSource.startsWith("node:") || nodeBuiltins.has(importSource)
					expect(isNodeBuiltin).toBe(false)
				}
			}

			if (/\bprocess\b/.test(content)) {
				const isGuarded = content.includes('typeof process !== "undefined"')
				expect(isGuarded).toBe(true)
			}

			const hasBuffer = /\bBuffer\b/.test(content)
			expect(hasBuffer).toBe(false)
		}
	})
})
