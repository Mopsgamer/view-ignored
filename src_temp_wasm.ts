/* eslint-disable @typescript-eslint/ban-ts-comment */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import './wasm/wasm_exec.js'

declare global {
  class Go {
    run(instance: WebAssembly.Instance): Promise<void>
    importObject: WebAssembly.Imports
    _pendingEvent: { id: number, this: Go, args: unknown[] } | { id: 0 }
    exited: boolean
    _resume: () => void
  }
}

const require = createRequire(import.meta.url)
globalThis.require = require
// @ts-expect-error
globalThis.fs = require('fs')
// @ts-expect-error
globalThis.path = require('path')
globalThis.TextEncoder = require('util').TextEncoder
globalThis.TextDecoder = require('util').TextDecoder

globalThis.performance ??= require('performance')

globalThis.crypto ??= require('crypto')

const go = new Go()

await WebAssembly.instantiate(readFileSync('./wasm/viewig.wasm'), go.importObject).then((result) => {
  process.on('exit', (code) => { // Node.js exits if no event handler is pending
    if (code === 0 && !go.exited) {
      // deadlock, make Go print error and stack traces
      go._pendingEvent = { id: 0 }
      go._resume()
    }
  })
  const p = go.run(result.instance)
  return p
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
