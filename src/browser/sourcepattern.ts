import * as fs from "fs"
import { join, dirname } from "path"
import FastGlob from "fast-glob"
import { FileSystemAdapter, SourceFile } from "./lib.js"

export interface SourcePatternReadOptions extends FastGlob.Options {
	/**
	 * Custom implementation of methods for working with the file system.
	 *
	 * @default fs.*
	 */
	fs?: FileSystemAdapter
}
export function readSourcePath(path: string, options?: SourcePatternReadOptions): Buffer {
	return (options?.fs?.readFileSync || fs.readFileSync)(join(options?.cwd ?? process.cwd(), path))
}
export function pathToSourceFile(path: string, options?: SourcePatternReadOptions): SourceFile {
	return {
		path: path,
		content: readSourcePath(path, options).toString()
	}
}

/**
 * Returns closest dir entry path for another one using the given list.
 * If `undefined`, no reliable sources that contain patterns to ignore.
 */
export function findDomination<T extends { path: string }>(filePath: string, paths: T[]): T | undefined {
	const filePathDir = dirname(filePath)
	const result = paths.reverse().find(p => {
		const pd = dirname(p.path)
		const result = filePathDir.startsWith(pd) || pd === '.'
		return result
	})
	return result
}
export class SourcePattern extends String {
	scan(options?: SourcePatternReadOptions): Promise<string[]> {
		const o: FastGlob.Options = {
			...options,
			onlyFiles: true,
			dot: true,
			followSymbolicLinks: false,
		}
		const stream = FastGlob.stream(String(this), o)
		const data: string[] = []
		stream.on('data', function (chunk: string) {
			data.push(chunk)
		})
		return new Promise(function (resolve) {
			stream.once('end', function () { resolve(data) })
		})
	}
	read(options?: SourcePatternReadOptions): Promise<SourceFile[]> {
		const sourceFile = this.scan(options)
			.then(pathList =>
				pathList.map(path =>
					pathToSourceFile(path, options)
				)
			)
		return sourceFile
	}
}