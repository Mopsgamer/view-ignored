import { scan } from './scan.js'
import { it } from 'node:test'
import * as assert from 'node:assert/strict'
import { Git } from './targets/git.js'

it('scan primitive git', async () => {
  assert.deepEqual(await scan({ targets: [Git] }), [])
})
