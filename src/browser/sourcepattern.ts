import * as fs from "fs"
import FastGlob from "fast-glob"
import path from "path"
import { FileSystemAdapter, SourceFile } from "./lib.js"

export interface SourcePatternReadOptions extends FastGlob.Options {
	/**
	 * Custom implementation of methods for working with the file system.
	 *
	 * @default fs.*
	 */
	fs?: FileSystemAdapter
}
export function readSourcePath(pth: string, options?: SourcePatternReadOptions): Buffer {
	return (options?.fs?.readFileSync || fs.readFileSync)(path.join(options?.cwd ?? process.cwd(), pth))
}
export class SourcePattern extends String {
	scan(options?: SourcePatternReadOptions): string[] {
		const o: FastGlob.Options = {
			...options,
			onlyFiles: true,
			dot: true,
			followSymbolicLinks: false,
		}
		const paths: string[] = FastGlob.sync(String(this), o)
		return paths
	}
	read(options?: SourcePatternReadOptions): SourceFile[] {
		const sourceFile: SourceFile[] = this.scan(options)
			.map(pth => ({ path: pth, content: readSourcePath(pth, options).toString() }))
		return sourceFile
	}
}