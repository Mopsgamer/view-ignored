import PATH from 'node:path'
import { type ChalkInstance } from 'chalk'
import * as nf from '@m234/nerd-fonts'
import { decorCondition, type DecorName } from '../styling.js'
import { type FilterName } from '../filtering.js'
import { File } from './file.js'
import { type SourceInfo } from './source-info.js'
import { type Directory } from './directory.js'

/**
 * @see {@link FileInfo.prototype.toString}
 */
export type FileInfoToStringOptions = {
  /**
   * On posix systems, this has no effect.  But, on Windows, it means that
   * paths will be `/` delimited, and absolute paths will be their full
   * resolved UNC forms, eg instead of `'C:\\foo\\bar'`, it would return
   * `'//?/C:/foo/bar'`
   * @default false
   * @returns `/` delimited paths, even on Windows.
   */
  posix?: boolean

  /**
   * The appearance behavior of the file icon.
   * @default undefined
   */
  fileIcon?: DecorName

  /**
   * Show the scanner's source after the file path.
   * @default false
   */
  source?: boolean

  /**
   * The appearance behavior of the prefix.
   * `"+"` for included, `"!"` for excluded.
   * @default false
   */
  usePrefix?: boolean

  /**
   * The behavior of colors.
   * @default undefined
   */
  chalk?: ChalkInstance

  /**
   * Determines if the path's base or the entire path should be formatted.
   * @default true
   */
  entire?: boolean
}

export type FileInfoStatus = 'ignored' | 'included' | 'non-target'

/**
 * The result of the file path scan.
 */
export class FileInfo extends File {
  static from(file: File, source?: SourceInfo) {
    return new FileInfo(
      file.parent,
      file.relativePath,
      file.absolutePath,
      source,
    )
  }

  /**
   * Determines if ignored file is ignored or not.
   */
  public readonly status: FileInfoStatus

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
     * The source of patterns.
     */
    public readonly source?: SourceInfo,
  ) {
    super(parent, relativePath, absolutePath)
    this.status = source === undefined
      ? 'non-target'
      : (source.scanner.ignores(relativePath) ? 'ignored' : 'included')
  }

  /**
   * @param options Styling options.
   * @returns Relative file path. Optionally formatted.
   */
  override toString(options?: FileInfoToStringOptions): string {
    const {
      fileIcon,
      chalk,
      usePrefix = false,
      source: useSource = false,
      entire = true,
      posix = false,
    } = options ?? {}
    const patha = posix ? PATH.posix : PATH
    const parsed = PATH.parse(this.relativePath)
    const glyph = nf.Seti.fromPath(parsed)
    const fIcon = fileIcon
      ? decorCondition(fileIcon, {
        ifEmoji: '📄',
        ifNerd: chalk && glyph.color !== undefined
          ? chalk.hex(glyph.color)(glyph.value)
          : glyph.value,
        postfix: ' ',
      })
      : ''
    let prefix = usePrefix && this.status !== 'non-target'
      ? (this.status === 'ignored' ? '!' : '+')
      : ''
    let postfix = useSource && this.source !== undefined
      ? ' < ' + this.source.toString()
      : ''

    if (chalk) {
      prefix = chalk.dim(prefix)
      postfix = chalk.dim(postfix)
      const clr = this.status === 'non-target'
        ? chalk.white
        : (this.status === 'included' ? chalk.green : chalk.white)
      if (entire) {
        return fIcon + clr(prefix + this.relativePath + postfix)
      }

      return parsed.dir + patha.sep + fIcon
        + clr(prefix + parsed.base + postfix)
    }

    if (entire) {
      return prefix + this.relativePath + postfix
    }

    return parsed.dir + patha.sep + fIcon + prefix + parsed.base + postfix
  }

  /**
   * @param filter The group name. Default: `"all"`
   * @returns `true`, if the file is contained by the filter.
   */
  isIncludedBy(
    filter?: FilterName | ((fileInfo: FileInfo) => boolean),
  ): boolean {
    if (typeof filter === 'function') {
      return filter(this)
    }

    filter ??= 'all'
    const filterIgnore = (filter === 'ignored') && this.status === 'ignored'
    const filterInclude = (filter === 'included') && this.status === 'included'
    const filterAll = filter === 'all'
    const result = filterIgnore || filterInclude || filterAll
    return result
  }
}
