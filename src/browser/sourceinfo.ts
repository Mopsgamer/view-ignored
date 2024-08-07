import { dirname, join } from "path"
import { FileSystemAdapter, Methodology, ScanFileOptions, Scanner } from "./lib.js"
import FastGlob from "fast-glob"
import arrify from "arrify"

export interface SourceInfoHierarcyOptions<T extends { toString(): string }> {
	/**
	 * @default true
	 */
	closest?: boolean
	/**
	 * @default undefined
	 */
	filter?: (path: T) => boolean
}

/**
 * The source of patterns.
 */
export class SourceInfo {
	/**
	 * The last source file content.
	 */
	public content?: Buffer

	constructor(
		/**
		 * The relative path to the file.
		 */
		public readonly sourcePath: string,

		/**
		 * The pattern parser.
		 */
		public readonly scanner: Scanner
	) { }

	/**
	 * Creates new {@link SourceInfo} instance.
	 */
	static from(path: string, methodology: Methodology): SourceInfo {
		const scanner = new Scanner({
			negated: methodology.matcherNegated,
			ignoreCase: methodology.ignoreCase,
			patternType: methodology.matcher
		})
		scanner.add(methodology.matcherAdd)
		scanner.addExclude(methodology.matcherExclude)
		scanner.addInclude(methodology.matcherInclude)
		return new SourceInfo(path, scanner)
	}

	/**
	 * Gets sources from the methodology.
	 */
	static fromMethodology(methodology: Methodology, options: ScanFileOptions): SourceInfo[] {
		const patterns = arrify(methodology.pattern)
		if (patterns.some(p => typeof p !== "string")) {
			return patterns as SourceInfo[]
		}

		const paths = FastGlob.sync(patterns as string[], {
			...options,
			onlyFiles: true,
			dot: true,
			followSymbolicLinks: false,
		})
		const sourceInfoList = paths.map(p => SourceInfo.from(p, methodology))
		return sourceInfoList
	}

	/**
	 * Selects the closest or farthest siblings relative to the path.
	 */
	static hierarcy<T extends { toString(): string }>(target: string, pathList: T[], options?: SourceInfoHierarcyOptions<T>): T | undefined {
		const { closest = true, filter: scan } = options ?? {}
		pathList = pathList.sort((a, b) => a.toString().localeCompare(b.toString()))

		const checkStack: string[] = []
		// fill checkStack
		let dir = target.toString()
		for (; ;) {
			const parent = dirname(dir)
			if (dir === parent) {
				break;
			}

			checkStack.push(dir = parent)
		}

		if (!closest) {
			checkStack.reverse()
		}

		const cacheDirNames: Map<T, string> = new Map()
		for (const dir of checkStack) {
			const closestPath = pathList.find(path => {
				let pathDir = cacheDirNames.get(path)
				if (!pathDir) {
					cacheDirNames.set(path, pathDir = dirname(path.toString()))
				}

				if (dir !== pathDir) {
					return false
				}

				return scan ? scan?.(path) : true
			})

			return closestPath
		}
	}

	/**
	 * @returns File path of the source.
	 */
	toString(): string {
		return this.sourcePath
	}

	/**
	 * @returns The contents of the source file.
	 */
	readSync(cwd: string | undefined, readFileSync: FileSystemAdapter["readFileSync"]): Buffer {
		cwd ??= process.cwd()
		return this.content = readFileSync(join(cwd, this.sourcePath))
	}
}
