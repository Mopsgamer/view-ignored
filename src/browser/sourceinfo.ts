import * as fs from "fs"
import { join, dirname } from "path"
import { FileSystemAdapter, Methodology, Scanner } from "./lib.js"

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

/**
 * @returns Closest dir entry path for another one using the given list.
 * If `undefined`, there are no reliable sources that contain patterns to ignore.
 */
export function findDomination(filePath: string | SourceInfo, paths: SourceInfo[]): SourceInfo | undefined {
	const filePathDir = dirname(typeof filePath === "string" ? filePath : filePath.sourcePath)
	const result = paths
		.reverse()
		.find(sourceInfo => {
			const sourceDir = dirname(sourceInfo.sourcePath)
			const result = sourceDir === '.' || filePathDir.startsWith(sourceDir)
			return result
		})
	return result
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
			ignoreCase: methodology.ignoreCase,
			patternType: methodology.matcher
		})
		scanner.add(methodology.matcherAdd)
		scanner.addExclude(methodology.matcherExclude)
		scanner.addInclude(methodology.matcherInclude)
		return new SourceInfo(path, scanner)
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
