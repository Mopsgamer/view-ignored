import { ColorSupportLevel } from "chalk"
import { FilterName, filterNameList, Binding, Sorting, Styling } from "./browser/index.js"
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

/**
 * Command-line configuration structure.
 */
export type Config = {
    color: `${ColorSupportLevel}`,
    target: string,
    filter: FilterName,
    sort: Sorting.SortName,
    style: Styling.StyleName,
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
 * Represents allowed values for each config property.
 */
export const configValues = {
    color: ["1", "2", "3", "4"],
    target: Binding.targetList(),
    filter: filterNameList,
    sort: Sorting.sortNameList,
    style: Styling.styleNameList
} as const

/**
 * @see {@link configValues}
 * @returns `true` if the value is a {@link Config}.
 */
export function configPartialGood(cfg: unknown): cfg is Partial<Config> {
    if (cfg?.constructor !== Object) {
        return false
    }
    const jsonobj = cfg as Record<string, string>
    return Object.entries(configValues).every(
        ([key, possible]) => key in jsonobj
            ? (possible.includes(String(jsonobj[key]) as never))
            : true
    )
}

/**
 * The config manipulator.
 * @todo Convert to a *class instance* or *just methods* and hide the 'data' property.
 */
export const configManager = {
    /**
     * Do not change this value directly.
     * @todo Make private.
     * @see {@link configManager}.
     */
    data: {} as Partial<Config>,
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
    },
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
    },
    /**
     * Sets a new value for the specified config property.
     * Expects a valid value.
     * @param key The name of the config property.
     * @param value The new value for the config property.
     */
    set<T extends ConfigKey>(key: T, value: Config[T]) {
        this.data[key] = value
        return this
    },
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
    },
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
    },
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
    },
} as const
