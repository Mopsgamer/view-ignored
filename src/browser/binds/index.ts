import {loadPlugin as load} from 'load-plugin';
import {isTargetBind, type TargetBind, targetSet} from './targets.js';

export * from './scanner.js';
export * from './targets.js';

/**
 * The result of loading.
 */
export type PluginLoaded = {
	moduleName: string;
	isLoaded: boolean;
	exports: unknown;
};

/**
 * If a plugin wants to change something, it must export it as default.
 */
export type PluginExport = {
	viewignored: {
		addTargets: TargetBind[];
	};
};

/**
 * Checks if the value is the {@link PluginExport}.
 */
export function isPluginExport(value: unknown): value is PluginExport {
	if (value?.constructor !== Object) {
		return false;
	}

	const vign = (value as Partial<PluginExport>).viewignored;
	return (vign?.constructor === Object)
        && 'addTargets' in vign && Array.isArray(vign.addTargets) && vign.addTargets.every(v => isTargetBind(v));
}

/**
 * Imports the plugin's exported data.
 */
export function importPlugin(exportData: PluginExport) {
	const {addTargets} = exportData.viewignored;
	for (const targetBind of addTargets) {
		targetSet(targetBind);
	}
}

/**
 * No rejects.
 * @param moduleName Plugin name.
 * @returns Import result for the module.
 */
export async function loadPlugin(moduleName: string): Promise<PluginLoaded> {
	try {
		const loader = async (): Promise<PluginLoaded> => {
			try {
				const exports = load(moduleName);
				const result: PluginLoaded = {moduleName, isLoaded: true, exports};
				if (isPluginExport(exports)) {
					importPlugin(exports);
				}

				return result;
			} catch (error: unknown) {
				const r = error as Record<string, unknown>;
				let reason: unknown = r;
				if (r?.code === 'ERR_MODULE_NOT_FOUND') {
					reason = r.message;
				}

				const fail: PluginLoaded = {moduleName, isLoaded: false, exports: reason};
				return fail;
			}
		};

		return await loader();
	} catch (error) {
		const reason: unknown = error;
		const fail: PluginLoaded = {moduleName, isLoaded: false, exports: reason};
		return fail;
	}
}

/**
 * Loads plugins one by one using {@link loadPlugin}.
 * @param moduleNameList The list of plugins.
 */
export async function loadPluginsQueue(moduleNameList?: string[]): Promise<PluginLoaded[]> {
	const resultList: PluginLoaded[] = [];
	for (const module of moduleNameList ?? []) {
		const result = await loadPlugin(module); // eslint-disable-line no-await-in-loop
		resultList.push(result);
	}

	return resultList;
}

export const builtInGit = import('./plugins/git.js');
void builtInGit.then(exp => exp.default).then(importPlugin); // eslint-disable-line unicorn/prefer-top-level-await
export const builtInVsce = import('./plugins/vsce.js');
void builtInVsce.then(exp => exp.default).then(importPlugin);// eslint-disable-line unicorn/prefer-top-level-await
export const builtInNpm = import('./plugins/npm.js');
void builtInNpm.then(exp => exp.default).then(importPlugin);// eslint-disable-line unicorn/prefer-top-level-await
export const builtInYarn = import('./plugins/yarn.js');
void builtInYarn.then(exp => exp.default).then(importPlugin);// eslint-disable-line unicorn/prefer-top-level-await

/**
 * Built-in plugins loading queue.
 */
export const builtIns = Promise.allSettled(
	[builtInGit, builtInVsce, builtInNpm, builtInYarn],
);
