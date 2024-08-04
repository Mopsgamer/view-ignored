import * as fs from "fs"
import { join, dirname } from "path"
import { FileSystemAdapter, Methodology, ScanFileOptions, Scanner } from "./lib.js"
import FastGlob from "fast-glob"
import arrify from "arrify"

/**
 * Gets the file's stats using a fs adapter.
 */
export function statSync(path: string, cwd?: string, fsa?: FileSystemAdapter): fs.Stats {
	const statsSync = fsa?.statSync || fs.statSync
	const filePath = join(cwd ?? process.cwd(), path)
	return statsSync(filePath)
}

/**
 * Reads the file's dir using a fs adapter.
 */
export function readdirSync(path: string, cwd?: string, fsa?: FileSystemAdapter): string[] {
	const readdirSync = fsa?.readdirSync || fs.readdirSync
	const filePath = join(cwd ?? process.cwd(), path)
	return readdirSync(filePath)
}

/**
 * Reads the file path using a fs adapter.
 */
export function readSourceSync(path: string, cwd?: string, fsa?: FileSystemAdapter): Buffer {
	const readFileSync = fsa?.readFileSync || fs.readFileSync
	const filePath = join(cwd ?? process.cwd(), path)
	return readFileSync(filePath)
}

/**
 * Reads the file path using a fs adapter.
 */
export function readSource(path: string, cwd?: string, fsa?: FileSystemAdapter): Promise<Buffer> {
	const readFile = fsa?.readFile || fs.readFile
	const filePath = join(cwd ?? process.cwd(), path)
	return new Promise((resolve, reject) => {
		readFile(filePath, function (err, data) {
			if (err) return reject(err)
			resolve(data)
		})
	})
}

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
	 * @returns File content.
	 */
	read(cwd?: string, fs?: FileSystemAdapter): Promise<Buffer> {
		const r = readSource(this.sourcePath, cwd, fs)
		r.then(c => this.content = c)
		return r
	}

	/**
	 * @returns File content.
	 */
	readSync(cwd?: string, fs?: FileSystemAdapter): Buffer {
		return this.content = readSourceSync(this.sourcePath, cwd, fs)
	}

	/**
	 * @returns Parent directory entry paths.
	 */
	readdirSync(cwd?: string, fs?: FileSystemAdapter): string[] {
		return readdirSync(dirname(this.sourcePath), cwd, fs)
	}
}
