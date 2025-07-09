import { type Directory, File, type Scanner } from '../lib.js'

/**
 * The source of patterns.
 */
export class SourceInfo extends File {
  static from(file: File, scanner: Scanner) {
    return new SourceInfo(
      file.parent,
      file.relativePath,
      file.absolutePath,
      scanner,
    )
  }

  constructor(
    /**
     * The parent of the file.
     */
    parent: Directory,
    /**
     * The relative path to the file.
     */
    relativePath: string,
    /**
     * The absolute path to the file.
     */
    absolutePath: string,
    /**
     * The scanner of patterns.
     */
    public readonly scanner: Scanner,
  ) {
    super(parent, relativePath, absolutePath)
  }
}
