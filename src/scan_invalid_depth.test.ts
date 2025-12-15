import { test } from 'node:test'
import { rejects } from 'node:assert/strict'
import { scan } from './scan.js'
import { Git } from './targets/git.js'

const signal = AbortSignal.timeout(1000)

test('depth -1 should throw', async () => {
  await rejects(async () => {
    await scan({ target: Git, depth: -1, signal })
  }, { name: 'TypeError', message: 'Depth must be a non-negative integer' })
})

test('depth 0 should not throw', async () => {
  await rejects(async () => {
    await scan({ target: Git, depth: 0, signal })
  }, { name: 'TimeoutError' })
})

test('depth 1 should not throw', async () => {
  await rejects(async () => {
    await scan({ target: Git, depth: 1, signal })
  }, { name: 'TimeoutError' })
})
