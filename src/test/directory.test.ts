import assert from 'node:assert'
import * as viewig from '../index.js'
import { describe, it } from 'node:test'

describe('directory', () => {
  it('iterator', () => {
    const directory = viewig.Directory.from([
      'foo',
      'bar/foo',
    ])
    assert.deepEqual(directory.deep().length, 3)
  })
})
