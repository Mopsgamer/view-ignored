import * as pth from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { resolve } from "import-meta-resolve";
import { TargetBind, targetSet } from "./targets.js";

export * from "./targets.js"

export interface PluginImportResult {
    moduleName: string
    isLoaded: boolean
    exports: unknown
}

export interface PluginExport {
    default: {
        viewignored_TargetBindList: TargetBind[]
    }
}

export function isPluginExport(value: unknown): value is PluginExport {
    if (value === null || typeof value !== "object" || !("default" in value)) {
        return false
    }
    const def = value.default
    return def !== null && typeof def === "object"
        && "viewignored_TargetBindList" in def
}

function importPlugin(exportData: PluginExport) {
    const { viewignored_TargetBindList } = exportData.default
    for (const targetBind of viewignored_TargetBindList) {
        targetSet(targetBind)
    }
}

/**
 * No rejects.
 * @param moduleName Plugin name.
 * @returns Import result for the module.
 */
export function loadPlugin(moduleName: string): Promise<PluginImportResult> {
    try {
        const p = pathToFileURL(resolve(moduleName, import.meta.url)).toString()
        return new Promise<PluginImportResult>((resolve) => {
            import(p)
                .catch((reason: unknown) => {
                    console.error('Unable to load \'%s\'. Reason:', moduleName)
                    console.error(reason)
                    const fail: PluginImportResult = { moduleName, isLoaded: false, exports: reason }
                    resolve(fail)
                })
                .then((exports: unknown) => {
                    if (!isPluginExport(exports)) {
                        const message = 'Invalid export - expected PluginExport module structure.'
                        const reason = new Error(message)
                        const fail: PluginImportResult = { moduleName, isLoaded: false, exports: reason }
                        console.error('Unable to import \'%s\'. Reason: %s', moduleName, message)
                        resolve(fail)
                        return;
                    }
                    const result: PluginImportResult = { moduleName, isLoaded: true, exports }
                    importPlugin(exports)
                    resolve(result)
                })
        })
    } catch (reason) {
        const fail: PluginImportResult = { moduleName, isLoaded: false, exports: reason }
        console.error('Unable to resolve \'%s\'. Reason:', moduleName)
        console.error(reason)
        return Promise.resolve(fail)
    }
}

export async function loadPlugins(moduleNameList?: string[]): Promise<PluginImportResult[]> {
    const resultList: PluginImportResult[] = []
    for (const module of moduleNameList ?? []) {
        const result = await loadPlugin(module)
        resultList.push(result)
    }
    return resultList;
}

async function loadBuiltInPlugin(path: string, browser: boolean = true): Promise<PluginImportResult> {
    const folderCore = pth.join(pth.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
    let folder: string = pth.join(folderCore, 'lib', 'plugins')
    if (browser) {
        folder = pth.join(folderCore, 'lib', 'browser', 'plugins')
    }
    const p = pth.join(folder, path)

    return await loadPlugin(p)
}

export const BuiltIns = Promise.allSettled([
    loadBuiltInPlugin("git.js"),
    loadBuiltInPlugin("npm.js"),
    loadBuiltInPlugin("vsce.js"),
    loadBuiltInPlugin("yarn.js")
])