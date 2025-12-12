import { scan } from './scan.js'
import { it } from 'node:test'
import * as assert from 'node:assert/strict'

it('scan primitive git', () => {
  assert.deepEqual(scan({ targets: [{
    getSource() {
      return {
        globs: [], // FIXME: implement and use gitignore
      }
    },
  }] }), [])
})
