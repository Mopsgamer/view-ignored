import * as pth from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { isTargetBind, TargetBind, targetSet } from "./targets.js";
import { loadPlugin as load } from "load-plugin";
import isInstalledGlobally from "is-installed-globally";

export * from "./targets.js"

/**
 * The result of loading.
 */
export interface PluginLoaded {
    moduleName: string
    isLoaded: boolean
    exports: unknown
}

/**
 * If a plugin wants to change something, it must export it as default.
 */
export interface PluginExport {
    viewignored_addTargets: TargetBind[]
}

/**
 * Checks if the value is the {@link PluginExport}.
 */
export function isPluginExport(value: unknown): value is PluginExport {
    if (value?.constructor !== Object) {
        return false
    }
    const v = value as Record<string, unknown>

    return Array.isArray(v.viewignored_addTargets) && v.viewignored_addTargets.every(isTargetBind)
}

/**
 * Imports the plugin's exported data.
 */
function importPlugin(exportData: PluginExport) {
    const { viewignored_addTargets } = exportData
    for (const targetBind of viewignored_addTargets) {
        targetSet(targetBind)
    }
}

/**
 * No rejects.
 * @param moduleName Plugin name.
 * @returns Import result for the module.
 */
export function loadPlugin(moduleName: string): Promise<PluginLoaded> {
    try {
        return new Promise<PluginLoaded>((resolve) => {
            load(moduleName, { global: isInstalledGlobally })
                .catch((reason: unknown) => {
                    console.error('Unable to load \'%s\'. Reason:', moduleName)
                    console.error(reason)
                    const fail: PluginLoaded = { moduleName, isLoaded: false, exports: reason }
                    resolve(fail)
                })
                .then((exports: unknown) => {
                    const result: PluginLoaded = { moduleName, isLoaded: true, exports }
                    if (isPluginExport(exports)) {
                        importPlugin(exports)
                    }
                    resolve(result)
                })
        })
    } catch (reason) {
        const fail: PluginLoaded = { moduleName, isLoaded: false, exports: reason }
        console.error('Unable to resolve \'%s\'. Reason:', moduleName)
        console.error(reason)
        return Promise.resolve(fail)
    }
}

/**
 * Loads plugins one by one using {@link loadPlugin}.
 * @param moduleNameList The list of plugins.
 */
export async function loadPlugins(moduleNameList?: string[]): Promise<PluginLoaded[]> {
    const resultList: PluginLoaded[] = []
    for (const module of moduleNameList ?? []) {
        const result = await loadPlugin(module)
        resultList.push(result)
    }
    return resultList;
}

/**
 * Loads built-in plugins.
 * @param path The path after the "plugins" directory.
 * @param browser Use plugins for a browser.
 */
async function loadBuiltInPlugin(path: string, browser: boolean = true): Promise<PluginLoaded> {
    const folderCore = pth.join(pth.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
    let folder: string = pth.join(folderCore, 'lib', 'plugins')
    if (browser) {
        folder = pth.join(folderCore, 'lib', 'browser', 'plugins')
    }
    const p = pth.join(folder, path)

    return await loadPlugin(p)
}

/**
 * Built-in plugins loading queue.
 */
export const BuiltIns = Promise.allSettled([
    loadBuiltInPlugin("git.js"),
    loadBuiltInPlugin("npm.js"),
    loadBuiltInPlugin("vsce.js"),
    loadBuiltInPlugin("yarn.js")
])
