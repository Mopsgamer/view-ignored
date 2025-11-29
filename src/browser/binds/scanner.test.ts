import assert from 'node:assert'
import { describe, it } from 'node:test'
import { ScannerGitignore, ScannerMinimatch } from './scanner.js'

describe('ScannerGitignore', () => {
  it('comment is valid', () => {
    assert.ok(new ScannerGitignore().isValid('#comment'))
  })
})

describe('ScannerMinimatch', () => {
  it('comment is valid', () => {
    assert.ok(new ScannerMinimatch().isValid('#comment'))
  })
  it('ignores dir', () => {
    const scanner = new ScannerMinimatch({ exclude: 'scripts' })
    assert.ok(scanner.ignores('scripts/run.ts'))
  })
})
