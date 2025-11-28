import assert from 'node:assert'
import * as viewig from '../../index.js'
import { describe, it } from 'node:test'

describe('ScannerGitignore', () => {
  it('comment is valid', () => {
    assert.ok(new viewig.Plugins.ScannerGitignore().isValid('#comment'))
  })
})

describe('ScannerMinimatch', () => {
  it('comment is valid', () => {
    assert.ok(new viewig.Plugins.ScannerMinimatch().isValid('#comment'))
  })
  it('ignores dir', () => {
    const scanner = new viewig.Plugins.ScannerMinimatch({ exclude: 'scripts' })
    assert.ok(scanner.ignores('scripts/run.ts'))
  })
})
