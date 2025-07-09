import * as minimatch from 'minimatch'
import { gitignoreToMinimatch } from '@humanwhocodes/gitignore-to-minimatch'
import { type Scanner } from '../lib.js'
import z from 'zod'

const { minimatch: isMatch, makeRe } = minimatch

export type PatternScannerOptions = {
  pattern?: string | string[]
  exclude?: string | string[]
  include?: string | string[]
  negated?: boolean
}

export type PatternScanner = Scanner & {
  pattern: string | string[]
  exclude: string | string[]
  include: string | string[]
  negated: boolean
  isValid(value: unknown): value is string | string[]
  ignores(path: string, pattern: string | string[]): boolean
  ignores(path: string, options?: PatternScannerOptions): boolean
  ignores(
    path: string,
    argument?: PatternScannerOptions | string | string[],
  ): boolean
}

export function ArrayPatternToString(pattern: string[] | string): string {
  if (Array.isArray(pattern)) {
    pattern = pattern.join('\n').trim()
  }

  return pattern.trim()
}

export class ScannerMinimatch implements PatternScanner {
  public negated: boolean
  protected _pattern: string | string[]
  get pattern() {
    return this._pattern
  }

  set pattern(value: string | string[]) {
    this._pattern = value
  }

  protected _exclude: string | string[]
  get exclude(): string | string[] {
    return this._exclude
  }

  set exclude(value: string | string[]) {
    this._exclude = value
  }

  protected _include: string | string[]
  get include(): string | string[] {
    return this._include
  }

  set include(value: string | string[]) {
    this._include = value
  }

  constructor(options?: PatternScannerOptions) {
    this._pattern = options?.pattern ?? []
    this._exclude = options?.exclude ?? []
    this._include = options?.include ?? []
    this.negated = options?.negated ?? false
  }

  isValid(value: unknown): value is string | string[] {
    if (!z.string().or(z.array(z.string())).safeParse(value).success) {
      return false
    }

    const val = ArrayPatternToString(value as string | string[])

    if (val === '') {
      return true
    }

    try {
      makeRe(val)
      return true
    }
    catch {
      return false
    }
  }

  private isMatch(
    p: string,
    pattern: string,
    options?: minimatch.MinimatchOptions,
  ): boolean {
    const patternList = pattern.split('\n')
    const positiveList: string[] = [], negativeList: string[] = []
    for (const pat of patternList) {
      if (pat[0] === '!') {
        negativeList.push(pat.substring(1))
        continue
      }
      positiveList.push(pat)
    }
    for (const pat of negativeList) {
      if (!isMatch(p, pat, options)) continue
      return false
    }
    for (const pat of positiveList) {
      if (!isMatch(p, pat, options)) continue
      return true
    }
    return false
  }

  ignores(path: string, pattern: string | string[]): boolean
  ignores(path: string, options?: PatternScannerOptions): boolean
  ignores(
    path: string,
    argument?: PatternScannerOptions | string | string[],
  ): boolean {
    if (Array.isArray(argument) || typeof argument === 'string') {
      argument = ArrayPatternToString(argument)
    }

    const minimatchOptions: minimatch.MinimatchOptions = {
      dot: true,
      matchBase: true,
    }

    let check: boolean
    if (typeof argument === 'string') {
      check = this.isMatch(path, argument, minimatchOptions)
      return this.negated ? !check : check
    }

    let pattern = ArrayPatternToString(argument?.exclude ?? this.exclude)
    check = this.isMatch(path, pattern, minimatchOptions)
    if (check) {
      return true
    }

    pattern = ArrayPatternToString(argument?.include ?? this.include)
    check = this.isMatch(path, pattern, minimatchOptions)
    if (check) {
      return false
    }

    pattern = ArrayPatternToString(argument?.pattern ?? this.pattern)
    const negated: boolean = argument?.negated ?? this.negated
    check = this.isMatch(path, pattern, minimatchOptions)
    return negated ? !check : check
  }
}

export class ScannerGitignore extends ScannerMinimatch {
  private static gitignoreToMinimatch<T extends string | string[]>(
    argument: T,
  ): T
  private static gitignoreToMinimatch(
    argument: string | string[],
  ): string | string[] {
    if (typeof argument === 'string') {
      return ScannerGitignore.gitignoreToMinimatch(argument.split(/\r?\n/))
        .join('\n')
    }

    return argument
      .map(p => p.replaceAll(/(#.+$|(?<!\\) )/gm, ''))
      .filter(s => s !== '')
      .map(p => gitignoreToMinimatch(p))
  }

  constructor(options?: PatternScannerOptions) {
    const newOptions = { ...options }
    for (const key of ['pattern', 'exclude', 'include'] as const) {
      const value = newOptions[key]
      if (!Object.hasOwn(newOptions, key) || value === undefined) {
        continue
      }

      const newPattern = ScannerGitignore.gitignoreToMinimatch(value)
      newOptions[key] = newPattern
    }

    super(options)
  }

  isValid(value: unknown): value is string | string[] {
    if (!z.string().or(z.array(z.string())).safeParse(value).success) {
      return false
    }

    const val = ArrayPatternToString(value as string | string[])

    if (val === '') {
      return true
    }

    try {
      const converted = ScannerGitignore.gitignoreToMinimatch(val)
      makeRe(converted)
      return true
    }
    catch {
      return false
    }
  }

  get pattern() {
    return this._pattern
  }

  set pattern(value: string | string[]) {
    const newPattern = ScannerGitignore.gitignoreToMinimatch(value)
    this._pattern = newPattern
  }

  get include() {
    return this._include
  }

  set include(value: string | string[]) {
    const newPattern = ScannerGitignore.gitignoreToMinimatch(value)
    this._include = newPattern
  }

  get exclude() {
    return this._exclude
  }

  set exclude(value: string | string[]) {
    const newPattern = ScannerGitignore.gitignoreToMinimatch(value)
    this._exclude = newPattern
  }
}
