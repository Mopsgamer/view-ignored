import * as PATH from 'node:path'
import process from 'node:process'
import * as FS from 'node:fs'
import { createRequire } from 'node:module'
import EventEmitter from 'node:events'
import pLimit, { type LimitFunction } from 'p-limit'
import { configDefault } from '../config.js'
import {
  type DeepStreamEventEmitter,
  Directory,
  File,
  FileInfo,
  type SourceInfo,
} from './fs/index.js'
import { targetGet } from './binds/index.js'
import { TargetNotBoundError } from './errors.js'
import { type FilterName } from './filtering.js'

export * from './errors.js'
export * from './fs/index.js'
export * as Filtering from './filtering.js'
export * as Styling from './styling.js'
export * as Sorting from './sorting.js'
export * as Plugins from './binds/index.js'

/**
 * ViewIgnored's package.json.
 */

export const package_ = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json')

/**
 * Uses `node:fs` and `node:fs/promises` by default.
 */
export type FileSystemAdapter = {
  readFileSync?: typeof FS.readFileSync
  readdirSync?: typeof FS.readdirSync
  promises?: {
    readdir(
      path: string,
      options: { withFileTypes: true },
    ): Promise<FS.Dirent[]>
    stat(path: string): Promise<FS.Stats>
  }
}

// #region scanning
/**
 * The custom scanner.
 */
export type Scanner = {
  /**
   * @returns `true`, if the given path is ignored.
   */
  ignores(path: string): boolean
}

/**
 * Recursively creates a cache scanner for each file.
 * @throws If the target does not allow the current ignore configurations: {@link ViewIgnoredError}.
 * For example, {@link https://www.npmjs.com/package/@vscode/vsce vsce} considers it invalid if your manifest is missing the 'engines' field.
 * Similarly, npm will raise an error if you attempt to publish a package without a basic 'package.json'.
 */
export type Methodology = (
  tree: Directory,
  realOptions: RealScanOptions,
) => Map<File, SourceInfo>

/**
 * Options with defaults and additional properties.
 */
export type RealScanOptions = Required<Omit<ScanOptions, 'fsa'>> & {
  modules: {
    /**
     * File system adapter.
     */
    fs: Required<FileSystemAdapter>
    /**
     * Path module adapter.
     */
    path: PATH.PlatformPath
  }
}

/**
 * Folder deep scanning options.
 */
export type ScanOptions = {
  /**
   * The target or the scan methodology.
   * @default "git"
   */
  target?: string | Methodology

  /**
   * The max concurrency for file-system operations.
   * @default 8
   */
  concurrency?: number

  /**
   * Custom implementation of methods for working with the file system.
   * @default import * as FS from "fs"
   */
  fsa?: FileSystemAdapter

  /**
   * The current working directory in which to search.
   * @default process.cwd()
   */
  cwd?: string

  /**
   * Specifies the maximum depth of a read directory relative to the start
   * directory.
   * @default Infinity
   */
  maxDepth?: number

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
   * Filter output.
   * @default "included"
   */
  filter?: FilterName | ((fileInfo: FileInfo) => boolean)
}

/**
 * Gets info about the each file: it is ignored or not.
 * @param directoryPath The relative path to the directory.
 * @throws If no valid sources: {@link ErrorNoSources}.
 */
export async function scan(
  directoryPath: string,
  options?: ScanOptions,
): Promise<FileInfo[]>

/**
 * Gets info about the each file: it is ignored or not.
 * @param directory The current working directory.
 * @throws If no valid sources: {@link ErrorNoSources}.
 */
export async function scan(
  directory: Directory,
  options?: ScanOptions,
): Promise<FileInfo[]>

/**
 * Gets info about the each file: it is ignored or not.
 * @param stream The stream of the current working directory reading.
 * @throws If no valid sources: {@link ErrorNoSources}.
 */
export async function scan(
  stream: DeepStreamEventEmitter,
  options?: ScanOptions,
): Promise<FileInfo[]>

/**
 * Gets info about the each file: it is ignored or not.
 * @param pathList The list of relative paths. The should be relative to the current working directory.
 * @throws If no valid sources: {@link ErrorNoSources}.
 */
export async function scan(
  pathList: string[],
  options?: ScanOptions,
): Promise<FileInfo[]>
export async function scan(
  argument0: string | string[] | Directory | DeepStreamEventEmitter,
  options?: ScanOptions,
): Promise<FileInfo[]> {
  options ??= {}
  const optionsReal = makeOptionsReal(options)

  if (typeof optionsReal.target === 'string') {
    const bind = targetGet(optionsReal.target)
    if (bind === undefined) {
      throw new TargetNotBoundError(optionsReal.target)
    }

    return scan(
      argument0 as Directory,
      Object.assign(options, bind.scanOptions),
    )
  }

  if (typeof argument0 === 'string') {
    const stream = Directory.deepStream(argument0, optionsReal)
    const result = scan(stream, options)
    stream.run()
    return result
  }

  if (Array.isArray(argument0)) {
    const tree: Directory = Directory.from(argument0, optionsReal.cwd)
    return scan(tree, options)
  }

  if (argument0 instanceof EventEmitter) {
    const { tree } = await argument0.endPromise
    return scan(tree, options)
  }

  const tree = argument0
  const cache = optionsReal.target(tree, optionsReal)
  const fileInfoList: FileInfo[] = []
  const promiseList: Array<Promise<void>> = []
  const cacheDirectories = new Map<Directory, LimitFunction>()
  for (const directory of [tree, ...tree.deep(Directory)]) {
    cacheDirectories.set(directory, pLimit(optionsReal.concurrency))
  }

  for (const entry of tree.deepIterator(File)) {
    const limit = cacheDirectories.get(entry.parent)!
    promiseList.push(limit(async () => {
      const sourceInfo = cache.get(entry)

      const fileInfo = FileInfo.from(entry, sourceInfo)
      const ignored = !fileInfo.isIncludedBy(optionsReal.filter)

      if (ignored) {
        return
      }

      fileInfoList.push(fileInfo)
    }))
  }

  await Promise.all(promiseList)

  return fileInfoList
}

/**
 * @returns Options with defaults and additional properties.
 */
export function makeOptionsReal(options?: ScanOptions): RealScanOptions {
  options ??= {}
  const posix = options.posix ?? false
  const concurrency = options.concurrency ?? configDefault.concurrency
  const optionsReal: RealScanOptions = {
    concurrency,
    target: options.target ?? 'git',
    cwd: options.cwd ?? process.cwd(),
    filter: options.filter ?? configDefault.filter,
    modules: {
      fs: (options.fsa ?? FS) as Required<FileSystemAdapter>,
      path: posix ? PATH.posix : PATH,
    },
    maxDepth: options.maxDepth ?? configDefault.depth,
    posix,
  }
  return optionsReal
}
// #endregion
