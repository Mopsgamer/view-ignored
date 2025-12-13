import { scan } from './scan.js'
import { it } from 'node:test'
import { match, partialDeepStrictEqual } from 'node:assert/strict'
import { Git } from './targets/git.js'

it('scan primitive git', async () => {
  const r = await scan({ targets: [Git], depth: 0, invert: false })
  const paths = Array.from(r.get(Git)!.paths)
  console.log(paths)
  partialDeepStrictEqual(paths, [
    '.gitattributes',
    '.gitignore',
    'bun.lock',
    'CHANGELOG.md',
    'eslint.config.mjs',
    'LICENSE.txt',
    'package.json',
    'README.md',
    'tsconfig.json',
  ])
  match(paths[0]!, /.vscode\//)
  match(paths[1]!, /.src\//)
})
