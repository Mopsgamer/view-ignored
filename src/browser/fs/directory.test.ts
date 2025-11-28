import assert from 'node:assert'
import { Directory } from './index.js'
import { describe, it } from 'node:test'

describe('directory', () => {
  it('iterator', () => {
    const directory = Directory.from([
      'foo',
      'bar/foo',
    ])
    assert.deepEqual(directory.deep().length, 3)
  })
})
