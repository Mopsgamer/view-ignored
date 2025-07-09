import { icons } from '@m234/nerd-fonts'
import { z } from 'zod'
import {
  BadSourceError,
  Directory,
  type File,
  InvalidPatternError,
  type Methodology,
  type Plugins,
  type SourceInfo,
} from '../../index.js'
import { type PatternScanner, ScannerGitignore } from '../scanner.js'
import { type TargetIcon, type TargetName } from '../targets.js'
import * as git from './git.js'

const id = 'jsr'
const name: TargetName = 'JSR'
const icon: TargetIcon = {
  ...icons['nf-ple-pixelated_squares_big'],
  color: '#F5DD1E',
}

/**
 * @internal
 */
export const matcherExclude = []

/**
 * @internal
 */
export const matcherInclude = []

/**
 * @internal
 */
export type ValidManifestJsr = {
  name: string
  version: string
  exports: string
  exclude?: string[]
  include?: string[]
  publish?: {
    exclude?: string[]
    include?: string[]
  }
}

/**
 * @internal
 */
export function isValidManifestJsr(value: unknown): value is ValidManifestJsr {
  return z.object({
    name: z.string(),
    version: z.string(),
    exports: z.string(),
    exclude: z.array(z.string()).optional(),
    include: z.array(z.string()).optional(),
    publish: z.object({
      exclude: z.array(z.string()).optional(),
      include: z.array(z.string()).optional(),
    }).optional(),
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

      if (/^(deno|jsr).jsonc?$/.test(sourceFile.base)) {
        const manifest = JSON.parse(
          o.modules.fs.readFileSync(sourceFile.absolutePath).toString(),
        ) as unknown
        if (!isValidManifestJsr(manifest)) {
          throw new BadSourceError(sourceFile, 'Must have \'name\', \'version\'.')
        }

        const { exclude, include, publish } = manifest

        if (
          exclude === undefined && include === undefined
          && publish === undefined
        ) {
          continue
        }

        const pattern = publish?.include ?? include

        if (!scanner.isValid(pattern)) {
          throw new BadSourceError(
            sourceFile,
            `Invalid pattern, got ${JSON.stringify(pattern)}`,
          )
        }

        scanner.negated = true
        scanner.pattern = pattern
        if (Array.isArray(scanner.exclude)) {
          scanner.exclude.push(...(publish?.exclude ?? exclude ?? []))
        }
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

const bind: Plugins.TargetBind = {
  id,
  icon,
  name,
  scanOptions: {
    target: sourceSearch(
      ['deno.json', 'deno.jsonc', 'jsr.json', 'jsr.jsonc'],
      new ScannerGitignore({
        exclude: matcherExclude,
        include: matcherInclude,
      }),
    ),
  },
}
const npm: Plugins.PluginExport = { viewignored: { addTargets: [bind] } }
export default npm
