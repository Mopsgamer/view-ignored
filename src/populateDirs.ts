import type { MatcherContext } from "./patterns/matcherContext.js"

export function populateDirs(signal: AbortSignal | undefined, ctx: MatcherContext): void {
	for (const [dir, count] of ctx.depthPaths) {
		signal?.throwIfAborted()
		if (count === 0) {
			continue
		}
		ctx.paths.add(dir + "/")
	}
}
