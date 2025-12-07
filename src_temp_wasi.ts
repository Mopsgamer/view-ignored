import { readFileSync } from 'node:fs'
import { WASI } from 'node:wasi'
import { env, argv } from 'node:process'

const args = argv

const wasi = new WASI({
  version: 'preview1',
  args, env,
  preopens: { [process.cwd()]: process.cwd() },
})

const { instance } = await WebAssembly.instantiate(
  readFileSync('./wasi/viewig.wasm'),
  wasi.getImportObject() as WebAssembly.Imports,
)

wasi.start(instance)
