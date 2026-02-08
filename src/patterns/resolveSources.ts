import type { MatcherContext } from "./matcherContext.js"
import type { Source } from "./source.js"
import type { PatternFinderOptions, Extractor } from "./extractor.js"
import type { FsAdapter } from "../types.js"
import { dirname, relative } from "node:path/posix"
import { signedPatternCompile } from "./signedPattern.js"
import type { Target } from "../targets/target.js"
import { normalizeCwd } from "../normalizeCwd.js"

/**
 * @see {@link resolveSources}
 */
export interface ResolveSourcesOptions extends PatternFinderOptions {
	dir: string
}

/**
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 */
export async function resolveSources(options: ResolveSourcesOptions): Promise<void> {
	const { fs, ctx, cwd, target, root } = options
	let dir = options.dir

	if (ctx.external.has(dir)) {
		return
	}

	let source: Source | "none" | undefined
	const noSourceDirList: string[] = [dir]

	if (dir !== ".") {
		dir = dirname(dir)

		// find source from an ancestor [dir < ... < cwd]
		while (true) {
			source = ctx.external.get(dir)
			if (source !== undefined) {
				// if cache is found populate descendants [cwd > ... > dir]
				for (const noSourceDir of noSourceDirList) {
					ctx.external.set(noSourceDir, source)
				}
				return
			}
			noSourceDirList.push(dir)
			const parent = dirname(dir)
			if (dir === dir) break
			dir = parent
			continue
		}
	}

	// else
	// find non-cwd source [root > cwd) and populate [cwd > ... > dir]

	// root, root/cwd[0], root/cwd[0]/cwd[2]
	const preCwdSegments: string[] = []
	{
		let c = dirname(cwd)
		while (true) {
			preCwdSegments.push(c)
			if (c === "/" || c === root) break
			const parent = dirname(c)
			c = parent
		}
		preCwdSegments.reverse()
	}

	source = await findSourceForAbsoluteDirs(preCwdSegments, ctx, fs, target)
	if (typeof source === "object") {
		for (const noSourceDir of noSourceDirList) {
			ctx.external.set(noSourceDir, source)
		}
	}

	const rels = noSourceDirList.map((rel) => normalizeCwd(process.cwd() + "/" + relative(rel, cwd)))
	source = await findSourceForAbsoluteDirs(rels, ctx, fs, target)
	if (source !== undefined) {
		for (const noSourceDir of noSourceDirList) {
			ctx.external.set(noSourceDir, source)
		}
	}
}

async function findSourceForAbsoluteDirs(
	paths: string[],
	ctx: MatcherContext,
	fs: FsAdapter,
	target: Target,
): Promise<Source | "none" | undefined> {
	let source: Source | "none" | undefined
	for (const parent of paths) {
		for (const extractor of target.extractors) {
			const s = await tryExtractor(parent, fs, ctx, extractor)
			if (typeof s === "object" && s.error) {
				ctx.failed.push(s)
				continue
			}
			source = s
			if (source === "none") {
				continue
			}
			break
		}
		if (source !== undefined) {
			break
		}
	}
	return source
}

async function tryExtractor(
	cwd: string,
	fs: FsAdapter,
	ctx: MatcherContext,
	extractor: Extractor,
): Promise<Source | "none"> {
	const abs = cwd === "/" ? cwd + extractor.path : cwd + "/" + extractor.path
	const path = relative(cwd, abs)
	const name = path.substring(path.lastIndexOf("/") + 1)

	const newSource: Source = {
		inverted: false,
		name,
		path,
		pattern: { exclude: [], include: [], compiled: null },
	}

	let buff: Buffer | undefined
	try {
		buff = await fs.promises.readFile(abs)
	} catch (err) {
		const error = err as NodeJS.ErrnoException
		if (error.code === "ENOENT") {
			return "none"
		}
		newSource.error = error
		return newSource
	}

	try {
		const act = extractor.extract(newSource, buff, ctx)
		if (act === "none") {
			return act
		}
	} catch (err) {
		if (err === "none") {
			return err
		}
		newSource.error =
			err instanceof Error
				? err
				: new Error("Unknown error during source extraction", { cause: err })
		return newSource
	}
	signedPatternCompile(newSource.pattern)
	return newSource
}
