import { scan } from './scan.js'
import { it } from 'node:test'
import { ok, partialDeepStrictEqual } from 'node:assert/strict'
import { Git } from './targets/git.js'

it('scan primitive git', async () => {
  const r = await scan({ targets: [Git], depth: 0, invert: false })
  const paths = Array.from(r.get(Git)!.paths)
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
  ok(paths[0]?.startsWith('.git/'))
  ok(paths[1]?.startsWith('.vscode/'))
  ok(paths[2]?.startsWith('.src/'))
})
