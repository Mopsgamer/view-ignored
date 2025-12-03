import { readFileSync } from 'node:fs'
import { WASI } from 'node:wasi'
import { env, argv as args, platform } from 'node:process'

// Passing env to WASI overrides "preopens" by PWD key.
// preopens: { [process.cwd()]: process.cwd() }
// Correct win32 PWD still will be converted to unix. We need native to be able to work.
if (platform === 'win32' && env['PWD']) {
  delete env['PWD']
}

const wasi = new WASI({ version: 'preview1', args, env, preopens: { [process.cwd()]: process.cwd() } })

const { instance } = await WebAssembly.instantiate(readFileSync('./wasi/viewig.wasm'), wasi.getImportObject() as WebAssembly.Imports)

wasi.start(instance)
