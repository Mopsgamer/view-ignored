import { icons } from '@m234/nerd-fonts'
import { type Plugins } from '../../index.js'
import { type TargetIcon, type TargetName } from '../targets.js'
import { ScannerGitignore } from '../scanner.js'
import * as npm from './npm.js'

const id = 'yarn'
const name: TargetName = 'Yarn'
const icon: TargetIcon = { ...icons['nf-seti-yarn'], color: '#2E2A65' }

/**
 * @internal
 */
export const matcherExclude = [
  ...npm.matcherExclude,
  '**/.yarnignore',
  '**/.yarnrc',
]

/**
 * @internal
 */
export const matcherInclude = [
  ...npm.matcherInclude,
]

const bind: Plugins.TargetBind = {
  id,
  icon,
  name,
  scanOptions: {
    target: npm.methodologyManifestNpmLike(
      ['package.json', '.yarnignore', '.npmignore', '.gitignore'],
      new ScannerGitignore({
        exclude: matcherExclude,
        include: matcherInclude,
      }),
    ),
  },
}
const yarn: Plugins.PluginExport = { viewignored: { addTargets: [bind] } }
export default yarn
