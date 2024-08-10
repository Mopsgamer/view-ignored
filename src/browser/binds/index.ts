import { isTargetBind, TargetBind, targetSet } from "./targets.js";
import { loadPlugin as load } from "load-plugin";

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
    viewignored: {
        addTargets: TargetBind[]
    }
}

/**
 * Checks if the value is the {@link PluginExport}.
 */
export function isPluginExport(value: unknown): value is PluginExport {
    if (value?.constructor !== Object) {
        return false
    }

    const vign = (value as Partial<PluginExport>).viewignored
    return (vign?.constructor === Object)
        && 'addTargets' in vign && Array.isArray(vign.addTargets) && vign.addTargets.every(isTargetBind)
}

/**
 * Imports the plugin's exported data.
 */
export function importPlugin(exportData: PluginExport) {
    const { addTargets } = exportData.viewignored
    for (const targetBind of addTargets) {
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
            load(moduleName)
                .catch((reason: unknown) => {
                    const r = reason as Record<string, unknown>
                    if (r?.code === 'ERR_MODULE_NOT_FOUND') {
                        reason = r.message
                    }
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
        return Promise.resolve(fail)
    }
}

/**
 * Loads plugins one by one using {@link loadPlugin}.
 * @param moduleNameList The list of plugins.
 */
export async function loadPluginsQueue(moduleNameList?: string[]): Promise<PluginLoaded[]> {
    const resultList: PluginLoaded[] = []
    for (const module of moduleNameList ?? []) {
        const result = await loadPlugin(module)
        resultList.push(result)
    }
    return resultList;
}

export const BuiltInGit = import("./plugins/git.js")
BuiltInGit.then(e => e.default).then(importPlugin)
export const BuiltInVsce = import("./plugins/vsce.js")
BuiltInVsce.then(e => e.default).then(importPlugin)
export const BuiltInNpm = import("./plugins/npm.js")
BuiltInNpm.then(e => e.default).then(importPlugin)
export const BuiltInYarn = import("./plugins/yarn.js")
BuiltInYarn.then(e => e.default).then(importPlugin)

/**
 * Built-in plugins loading queue.
 */
export const BuiltIns = Promise.allSettled(
    [BuiltInGit, BuiltInVsce, BuiltInNpm, BuiltInYarn]
)
