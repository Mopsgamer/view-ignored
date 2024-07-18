import * as fs from "fs"
import { join, dirname } from "path"
import { FileSystemAdapter } from "./lib.js"

/**
 * Reads the file path using fs adapter.
 */
function readSourceSync(path: string, cwd?: string, fsa?: FileSystemAdapter): Buffer {
	const readFileSync = fsa?.readFileSync || fs.readFileSync
	const filePath = join(cwd ?? process.cwd(), path)
	return readFileSync(filePath)
}

/**
 * Reads the file path using fs adapter.
 */
function readSource(path: string, cwd?: string, fsa?: FileSystemAdapter): Promise<Buffer> {
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
export function findDomination(filePath: string, paths: string[]): string | undefined {
	const filePathDir = dirname(filePath)
	const result = paths.reverse().find(p => {
		const pd = dirname(p)
		const result = filePathDir.startsWith(pd) || pd === '.'
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
		 * Relative path to the file.
		 */
		public sourcePath: string
	) { }

	/**
	 * Creates new {@link SourceInfo} from the file path.
	 */
	static from(path: string): SourceInfo {
		return new SourceInfo(path)
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
	read(): Promise<Buffer> {
		const r = readSource(this.sourcePath)
		r.then(c => this.content = c)
		return r
	}

	/**
	 * @returns File content.
	 */
	readSync(): Buffer {
		return this.content = readSourceSync(this.sourcePath)
	}
}
