import { ColorSupportLevel } from "chalk"
import { FilterName, filterNameList, isFilterName, Plugins, Sorting, Styling } from "./browser/index.js"
import * as os from "os";
import propertiesFile from "properties";
import path from "path"
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs"

/**
 * The full config file name - `".view-ignored"`.
 */
export const configFileName = ".view-ignored"

/**
 * The user's home directory + the config file name.
 * @see {@link os.homedir}
 */
export const configFilePath = path.join(os.homedir(), configFileName)

/**
 * Command-line configuration property list.
 */
export const configKeyList = ["color", "target", "filter", "sort", "style"] as const satisfies readonly (keyof Config)[]

/**
 * Command-line configuration property type.
 */
export type ConfigKey = typeof configKeyList[number] & keyof Config

export function isConfigKey(value: unknown): value is ConfigKey {
    return typeof value === "string" && configKeyList.includes(value as ConfigKey)
}

export function isConfigValue<T extends ConfigKey>(key: T, value: unknown): value is Config[T] {
    const c = {
        color: isColorType,
        target: Plugins.isBoundId,
        filter: isFilterName,
        sort: Sorting.isSortName,
        style: Styling.isStyleName
    } as const
    return c[key](value)
}

export type ConfigPair<KeyT extends ConfigKey = ConfigKey> = [key: KeyT, value: Config[KeyT]]

/**
 * Command-line configuration structure.
 */
export type Config = {
    color: ColorType,
    target: string,
    filter: FilterName,
    sort: Sorting.SortName,
    style: Styling.StyleName,
}

export const colorTypeList = ["0", "1", "2", "3"] as const
export type ColorType = `${ColorSupportLevel}`
export function isColorType(value: unknown): value is ColorType {
    return typeof value === "string" && colorTypeList.includes(value as ColorType)
}

/**
 * Command-line default config values.
 */
export const configDefault: Config = {
    color: "3",
    target: "git",
    filter: "included",
    sort: "firstFolders",
    style: "treeEmoji",
}

/**
 * @see {@link isConfigValue}
 * @returns `true` if the value is a {@link Config}.
 */
export function configPartialGood(cfg: unknown): cfg is Partial<Config> {
    if (cfg?.constructor !== Object) {
        return false
    }
    const jsonobj = cfg as Record<string, string>
    return Object.entries(isConfigValue).every(
        ([key, check]) => key in jsonobj
            ? (check(String(jsonobj[key])))
            : true
    )
}

/**
 * Returns available values for the specified property.
 * @param key The config property.
 * @param fallbackDefault If `true`, the default value will be used when the value is `undefined`. Default `true`.
 */
export function configValueList<T extends ConfigKey>(key: T): Config[T][] {
    if (key === "target") {
        /** optimization - do not create dynamic list if key is other than "target" */
        return Plugins.targetList() as Config[T][]
    }

    /**
     * Represents allowed values for each config property.
     */
    const configAvailable = {
        color: colorTypeList,
        filter: filterNameList,
        target: [], // never
        sort: Sorting.sortNameList,
        style: Styling.styleNameList
    }
    return configAvailable[key] as Config[T][]
}

class ConfigManager {
    /**
     * Do not change this value directly.
     * @todo Make private.
     * @see {@link configManager}.
     */
    private data = {} as Partial<Config>

    /**
     * Loads the config from the file to {@link configManager.data}. If the data is not valid, throws an error without loading.
     * @returns `undefined` if the config file does not exist.
     */
    load() {
        const parsed: unknown | undefined = existsSync(configFilePath) ? propertiesFile.parse(readFileSync(configFilePath).toString()) : undefined
        if (parsed === undefined) {
            return this
        }
        if (!configPartialGood(parsed)) {
            throw new TypeError(`Invalid config. Got ${parsed && JSON.stringify(parsed)}.`)
        }
        Object.assign(this.data, parsed)
        return this
    }

    /**
     * Saves the partial config to the file. If there are no settings, the file will be deleted, if exists.
     */
    save() {
        if (Object.keys(this.data).length === 0) {
            if (existsSync(configFilePath)) {
                rmSync(configFilePath)
            }
            return this
        }
        writeFileSync(configFilePath, propertiesFile.stringify(this.data)!)
        return this
    }

    /**
     * Sets a new value for the specified config property.
     * Expects a valid value.
     * @param key The name of the config property.
     * @param value The new value for the config property.
     */
    set<T extends ConfigKey>(key: T, value: Config[T]) {
        this.data[key] = value
        return this
    }

    /**
     * Deletes the specified property from the config.
     * If the property is not specified, then all properties will be deleted.
     * @param key The config property.
     */
    unset<T extends ConfigKey>(key?: T) {
        if (key === undefined) {
            for (const key of Object.keys(this.data)) {
                delete this.data[key as T]
            }
            return this
        }
        delete this.data[key]
        return this
    }

    /**
     * Returns the value for the specified property.
     * @param key The config property.
     * @param fallbackDefault If `true`, the default value will be used when the value is `undefined`. Default `true`.
     */
    get<T extends ConfigKey>(key: T, fallbackDefault: boolean = true): typeof fallbackDefault extends true ? Config[T] : Config[T] | undefined {
        const value: Config[T] | undefined = this.data[key]
        if (fallbackDefault && value === undefined) {
            return configDefault[key]
        }
        return value
    }

    /**
     * @param key The config property.
     * @param fallbackDefault If `true`, the default value will be used when the value is `undefined`. Default `true`.
     * @returns The string in the `"key=value"` format, if the property is specified.
     * Otherwise in format `"key=value\nkey=value\n..."` without new line ending.
     */
    getPairString<T extends ConfigKey>(key?: T, fallbackDefault: boolean = true): string {
        if (key === undefined) {
            return configKeyList.map((key) => this.getPairString(key as T, fallbackDefault)).filter(Boolean).join('\n')
        }
        const val = this.get(key, fallbackDefault)
        return val ? `${key}=${val}` : ''
    }
}

/**
 * The config manipulator.
 */
export const configManager = new ConfigManager
