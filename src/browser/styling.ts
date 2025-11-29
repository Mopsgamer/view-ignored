import PATH from 'node:path'
import tree from 'treeify'
import jsonifyPaths from 'jsonify-paths'
import type { ChalkInstance } from 'chalk'
import type { FileInfo } from './lib.js'

export type FormatFilesOptions = {
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
   * @default false
   */
  showSources?: boolean

  /**
   * @default "paths"
   */
  style: StyleName

  /**
   * @default "paths"
   */
  decor?: DecorName

  /**
   * @default undefined
   */
  chalk?: ChalkInstance
}

/**
 * @returns Prints a readable file list. Here is '\n' ending.
 */
export function formatFiles(
  files: FileInfo[],
  options: FormatFilesOptions,
): string {
  const { showSources = false, chalk, decor = 'normal', style, posix = false }
    = options ?? {}

  const patha = posix ? PATH.posix : PATH
  const isPaths = style === 'paths'
  const paths = files.map(f =>
    f.toString({
      fileIcon: decor,
      usePrefix: true,
      chalk,
      source: showSources,
      entire: isPaths,
    }),
  )

  if (isPaths) {
    return paths.join('\n') + '\n'
  }

  // IsTree
  const pathsAsObject = jsonifyPaths.from(paths, { delimiter: patha.sep })
  const pathsAsTree = tree.asTree(pathsAsObject, true, true)
  return pathsAsTree
}

/**
 * Contains all style names.
 */
export const styleNameList = ['tree', 'paths'] as const

/**
 * Contains all style names as a type.
 */
export type StyleName = typeof styleNameList[number]

/**
 * Checks if the value is the {@link StyleName}.
 */
export function isStyleName(value: unknown): value is StyleName {
  return typeof value === 'string'
    && styleNameList.includes(value as StyleName)
}

/**
 * Contains all decor names.
 */
export const decorNameList = ['normal', 'emoji', 'nerdfonts'] as const

/**
 * Contains all decor names as a type.
 */
export type DecorName = typeof decorNameList[number]

/**
 * Checks if the value is the {@link DecorName}.
 */
export function isDecorName(value: unknown): value is DecorName {
  return typeof value === 'string'
    && decorNameList.includes(value as DecorName)
}

/**
 * Formatting options for the {@link decorCondition}.
 */
export type DecorConditionOptions = {
  /**
   * @default ""
   */
  prefix?: string

  /**
   * @default ""
   */
  postfix?: string

  /**
   * If the decor is not an emoji or nerd use this string.
   * @default ""
   */
  ifNormal?: string

  /**
   * If style name (lowercase) contains `emoji` use this string.
   * @default ""
   */
  ifEmoji?: string

  /**
   * If style name (lowercase) contains `nerd` use this string.
   * @default ""
   */
  ifNerd?: string
}

/**
 * Formats the string for specific style types.
 * @param decor The decor name.
 * @param condition Formatting options.
 */
export function decorCondition(
  decor: DecorName,
  condition: DecorConditionOptions,
): string {
  let result: string = condition.ifNormal ?? ''
  if (decor === 'emoji') {
    result = condition.ifEmoji ?? result
  }
  else if (decor === 'nerdfonts') {
    result = condition.ifNerd ?? result
  }

  if (result !== '') {
    result = (condition.prefix ?? '') + result + (condition.postfix ?? '')
  }

  return result
}
