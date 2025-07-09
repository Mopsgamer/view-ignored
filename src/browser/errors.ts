import { type File } from './lib.js'

export class ViewIgnoredError extends Error {
  name = 'ViewIgnoredError'
}

export class NoSourceError extends ViewIgnoredError {
  static joinOr(fileBaseList: string[]) {
    return fileBaseList.map(base => `'${base}'`).join(' or ')
  }

  static joinAnd(fileBaseList: string[]) {
    return fileBaseList.map(base => `'${base}'`).join(' and ')
  }

  name = 'NoSourceError'
  /**
   * @param fileBase Excpected message in the brackets. Describes which files was expected (e.g. 'config.json').
   * @example
   * new NoSourceError('\'package.json\'')
   * new NoSourceError(NoSourceError.joinOr(['package.json', '.npmignore']))
   * new NoSourceError(NoSourceError.joinAnd(['package.json', '.npmignore']))
   */
  constructor(fileBase: string)
  /**
   * @param file The {@link File} instance ('relativePath' property will be used).
   */
  constructor(file: File)
  constructor(argument0: File | string) {
    super(
      `There was no configuration file (${
        typeof argument0 === 'string' ? argument0 : argument0.relativePath
      }) in the folders and subfolders that would correctly describe the ignoring.`,
    )
  }
}

export class BadSourceError extends ViewIgnoredError {
  name = 'BadSourceError'
  /**
   * @param fileBase The base of the file (e.g. 'config.json').
   * @param message The following message after the colon. First letter uppercase, no dot.
   * @example
   * new BadSourceError('package.json', 'Must have name and version')
   */
  constructor(fileBase: string, message: string)
  /**
   * @param fileBase The {@link File} instance ('relativePath' property will be used).
   * @param message The following message after the colon. First letter uppercase, no dot.
   * @example
   * new BadSourceError('package.json', 'Must have name and version')
   */
  constructor(file: File, message: string)
  constructor(argument0: File | string, message: string) {
    super(
      `Invalid ${
        typeof argument0 === 'string' ? argument0 : argument0.relativePath
      }: ${message}`,
    )
  }
}

export class InvalidPatternError extends ViewIgnoredError {
  name = 'InvalidPatternError'
  constructor(file: File, pattern?: string | string[]) {
    super(
      `Invalid pattern in ${file.relativePath}: ${
        pattern === undefined ? '' : ` Pattern: ${JSON.stringify(pattern)}`
      }`,
    )
  }
}

export class TargetNotBoundError extends ViewIgnoredError {
  name = 'TargetNotBoundError'
  constructor(targetId: string) {
    super(`The target has no bound: '${targetId}'.`)
  }
}
