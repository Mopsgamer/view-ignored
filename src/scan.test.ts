import { scan } from './scan.js'
import { it } from 'node:test'
import * as assert from 'node:assert/strict'
import { Git } from './targets/git.js'

it('scan primitive git', async () => {
  const r = await scan({ targets: [Git], depth: 0 })
  assert.deepEqual(Array.from(r.get(Git).paths), [''])
})
