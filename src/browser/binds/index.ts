import { loadPlugin as load } from 'load-plugin'
import pLimit from 'p-limit'
import { isTargetBind, type TargetBind, targetSet } from './targets.js'

export * from './scanner.js'
export * from './targets.js'

/**
 * @internal
 */
const builtInImportMap: Record<BuiltInName, string> = {
  git: './plugins/git.js',
  npm: './plugins/npm.js',
  vsce: './plugins/vsce.js',
  yarn: './plugins/yarn.js',
}

/**
 * Built-in name list.
 */
export const builtInNameList = ['git', 'npm', 'vsce', 'yarn'] as const

/**
 * Built-in name type.
 */
export type BuiltInName = typeof builtInNameList[number]

/**
 * The result of loading.
 */
export type PluginLoaded = {
  resource: string
  isLoaded: boolean
  exports: unknown
}

/**
 * If a plugin wants to change something, it must export default.
 * @internal
 */
export type PluginExport = {
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
    && 'addTargets' in vign && Array.isArray(vign.addTargets) && vign.addTargets.every(v => isTargetBind(v))
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
 * @param modulePath The plugin name.
 * @returns The import result for the module.
 */
export async function loadPlugin(modulePath: string, useImport = false): Promise<PluginLoaded> {
  try {
    const exports: unknown = useImport ? Object.getOwnPropertyDescriptor(await import(modulePath), 'default')?.value : await load(modulePath)
    const result: PluginLoaded = { resource: modulePath, isLoaded: true, exports }
    if (isPluginExport(exports)) {
      importPlugin(exports)
    }

    return result
  }
  catch (error: unknown) {
    const r = error as Record<string, unknown>
    let reason: unknown = r
    if (r?.code === 'ERR_MODULE_NOT_FOUND') {
      reason = r.message
    }

    const fail: PluginLoaded = { resource: modulePath, isLoaded: false, exports: reason }
    return fail
  }
}

/**
 * @param modulePathList The plugin name list.
 * @returns The import result for the list of modules.
 */
export async function loadPlugins(modulePathList: string[]): Promise<PluginLoaded[]> {
  const limit = pLimit(5)
  const allLoaded = await Promise.all(modulePathList.map(modulePath => limit(() => loadPlugin(modulePath))))
  return allLoaded
}

/**
 * Load any built-in plugin.
 */
export function loadBuiltIn(builtIn: BuiltInName): Promise<PluginLoaded> {
  return loadPlugin(builtInImportMap[builtIn], true)
}

/**
 * @param modulePathList The plugin name list.
 * @returns The import result for the list of modules.
 */
export async function loadBuiltIns(builtInList: BuiltInName[] = [...builtInNameList]): Promise<PluginLoaded[]> {
  const limit = pLimit(5)
  const allLoaded = await Promise.all(builtInList.map(modulePath => limit(() => loadBuiltIn(modulePath))))
  return allLoaded
}
