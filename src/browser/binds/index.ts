import * as path from "path";
import { stderr } from "process";
import { fileURLToPath, pathToFileURL } from "url";

export * from "./targets.js"

export type PluginImportResult = [module: string, isLoaded: boolean, info: unknown]

export async function loadPlugin(module: string): Promise<PluginImportResult> {
    let result: PluginImportResult;
    try {
        result = [module, true, await import(pathToFileURL(module).toString())]
    } catch (error) {
        result = [module, false, error]
        stderr.write(`Unable to load '${module}'. Reason:\n`)
        stderr.write(String(error instanceof Error ? error.message : error))
        stderr.write('\n')
    }
    return result
}

export async function loadBuiltInPlugin(builtIn: string, browser: boolean = true): Promise<PluginImportResult> {
    const folderCore = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
    let folder: string = path.join(folderCore, 'lib', 'plugins')
    if(browser) {
        folder = path.join(folderCore, 'lib', 'browser', 'plugins')
    }
    const p = path.join(folder, builtIn)
    return loadPlugin(p)
}
