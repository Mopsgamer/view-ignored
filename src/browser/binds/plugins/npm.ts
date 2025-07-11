import { icons } from '@m234/nerd-fonts'
import { z } from 'zod'
import {
  BadSourceError,
  Directory,
  type File,
  InvalidPatternError,
  type Methodology,
  NoSourceError,
  type Plugins,
  type SourceInfo,
} from '../../index.js'
import { type PatternScanner, ScannerGitignore } from '../scanner.js'
import { type TargetIcon, type TargetName } from '../targets.js'
import * as git from './git.js'

const id = 'npm'
const name: TargetName = 'NPM'
const icon: TargetIcon = { ...icons['nf-seti-npm'], color: '#CA0404' }
const testCommand = 'npm pack --dry-run'

/**
 * @internal
 */
export const matcherExclude = [
  ...git.matcherExclude,
  '**/node_modules/**',
  '**/.*.swp',
  '**/._*',
  '**/.DS_Store/**',
  '**/.git/**',
  '**/.gitignore',
  '**/.hg/**',
  '**/.npmignore',
  '**/.npmrc',
  '**/.lock-wscript',
  '**/.svn/**',
  '**/.wafpickle-*',
  '**/config.gypi',
  '**/CVS/**',
  '**/npm-debug.log',
]

/**
 * @internal
 */
export const matcherInclude = [
  'bin/**',
  'package.json',
  'README*',
  'LICENSE*',
  'LICENCE*',
]

/**
 * @internal
 */
export type ValidManifestNpm = {
  name: string
  version: string
  files?: string[]
}

/**
 * @internal
 */
export function isValidManifestPackageJson(
  value: unknown,
): value is ValidManifestNpm {
  return z.object({
    name: z.string(),
    version: z.string(),
    files: z.array(z.string()).optional(),
  }).safeParse(value).success
}

/**
 * @internal
 */
export function useChildren(
  tree: Directory,
  map: Map<File, SourceInfo>,
  getMap: (child: Directory) => Map<File, SourceInfo>,
) {
  for (const child of tree.children.values()) {
    if (!(child instanceof Directory)) {
      continue
    }

    const submap = getMap(child)
    for (const [key, value] of submap.entries()) {
      map.set(key, value)
    }
  }

  return map
}

/**
 * @internal
 */
export const sourceSearch = (
  priority: string[],
  scanner: PatternScanner,
): Methodology =>
  function (tree, o) {
    const map = new Map<File, SourceInfo>()

    for (const element of priority) {
      const sourceFile = tree.get(element)

      if (sourceFile === undefined) {
        continue
      }

      if (sourceFile.base === 'package.json') {
        const manifest = JSON.parse(
          o.modules.fs.readFileSync(sourceFile.absolutePath).toString(),
        ) as unknown
        if (!isValidManifestPackageJson(manifest)) {
          throw new BadSourceError(
            sourceFile,
            'Must have \'name\', \'version\' and \'files\'.',
          )
        }

        const { files: pattern } = manifest

        if (pattern === undefined) {
          continue
        }

        if (!scanner.isValid(pattern)) {
          throw new BadSourceError(
            sourceFile,
            `Invalid pattern, got ${JSON.stringify(pattern)}`,
          )
        }

        scanner.negated = true
        scanner.pattern = pattern
      }
      else {
        const content = o.modules.fs.readFileSync(sourceFile.absolutePath)
          .toString()
        const pattern = content
        if (!scanner.isValid(pattern)) {
          throw new InvalidPatternError(sourceFile, pattern)
        }

        scanner.negated = false
        scanner.pattern = pattern
      }

      return git.useSourceFile(map, sourceFile, scanner)
    }

    return useChildren(tree, map, child =>
      sourceSearch(priority, scanner)(child, o))
  }

/**
 * @param priority The list of file names from highest to lowest priority.
 * @param scanner The pattern scanner.
 * @internal
 */
export const methodologyManifestNpmLike = (
  priority: string[],
  scanner: PatternScanner,
): Methodology =>
  function (tree, o) {
    const packageJson = tree.get('package.json')
    if (packageJson === undefined) {
      throw new NoSourceError('\'package.json\' in the root')
    }

    const packageJsonContent = o.modules.fs.readFileSync(
      packageJson.absolutePath,
    ).toString()
    let manifest: unknown
    try {
      manifest = JSON.parse(packageJsonContent)
    }
    catch (error) {
      if (error instanceof Error) {
        throw new BadSourceError(packageJson, error.message)
      }

      throw error
    }

    if (!isValidManifestPackageJson(manifest)) {
      throw new BadSourceError(
        packageJson,
        'Must have \'name\', \'version\' and \'files\'.',
      )
    }

    return sourceSearch(
      priority,
      scanner,
    )(tree, o)
  }

const bind: Plugins.TargetBind = {
  id,
  icon,
  name,
  testCommand,
  scanOptions: {
    target: methodologyManifestNpmLike(
      ['package.json', '.npmignore', '.gitignore'],
      new ScannerGitignore({
        exclude: matcherExclude,
        include: matcherInclude,
      }),
    ),
  },
}
const npm: Plugins.PluginExport = { viewignored: { addTargets: [bind] } }
export default npm
