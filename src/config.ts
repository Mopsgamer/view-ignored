import { ColorSupportLevel } from "chalk"
import { FilterName, filterNameList, isFilterName, Plugins, Sorting, Styling } from "./browser/index.js"
import * as os from "os";
import propertiesFile from "properties";
import path from "path"
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs"
import { Option } from "commander";

/**
 * Contains all color level names.
 */
export const colorTypeList = ["0", "1", "2", "3"] as const
/**
 * Contains all color level names as a type.
 */
export type ColorType = `${ColorSupportLevel}`
/**
 * Checks if the value is the {@link ColorType}.
 */
export function isColorType(value: unknown): value is ColorType {
    return typeof value === "string" && colorTypeList.includes(value as ColorType)
}

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
export const configKeyList = ["color", "target", "filter", "sort", "style", "decor", "showSources"] as const satisfies readonly (keyof Config)[]

/**
 * Command-line configuration's key type.
 */
export type ConfigKey = typeof configKeyList[number] & keyof Config

/**
 * Checks if the value is the {@link ConfigKey}.
 */
export function isConfigKey(value: unknown): value is ConfigKey {
    return typeof value === "string" && configKeyList.includes(value as ConfigKey)
}

export type ConfigValue<KeyT extends ConfigKey = ConfigKey, Safe extends boolean = true> = Safe extends true ? Config[KeyT] : Config[KeyT] | undefined

export type ShowSourcesType = 'true' | 'false'

export function isShowSources(value: unknown): value is ShowSourcesType {
    return value === 'true' || value === 'false'
}

/**
 * Checks if the value is the {@link Config} value for the specific {@link ConfigKey}.
 */
export function isConfigValue<T extends ConfigKey>(key: T, value: unknown): value is Config[T] {
    const c: Record<ConfigKey, (value: unknown) => boolean> = {
        color: isColorType,
        target: Plugins.isBoundId,
        filter: isFilterName,
        sort: Sorting.isSortName,
        style: Styling.isStyleName,
        decor: Styling.isDecorName,
        showSources: isShowSources
    }

    const check = c[key]
    return check(value)
}

/**
 * Represents array with the key nad the value.
 */
export type ConfigPair<KeyT extends ConfigKey = ConfigKey, Safe extends boolean = true> = [key: KeyT, value: ConfigValue<KeyT, Safe>]

/**
 * Command-line configuration structure.
 * @see {@link configKeyList} Before adding new properties.
 */
export type Config = {
    color: ColorType,
    target: string,
    filter: FilterName,
    sort: Sorting.SortName,
    style: Styling.StyleName,
    decor: Styling.DecorName,
    showSources: ShowSourcesType
}

/**
 * Command-line default config values.
 */
export const configDefault: Readonly<Config> = {
    color: "3",
    target: "git",
    filter: "included",
    sort: "firstFolders",
    style: "tree",
    decor: "normal",
    showSources: "false"
}

/**
 * @returns `true`, if the value can be used as a configuration.
 */
export function isConfigPartial(cfg: unknown): cfg is Partial<Config> {
    if (cfg?.constructor !== Object) {
        return false
    }
    const jsonobj = cfg as Record<string, unknown>
    return Object.entries(jsonobj).every(
        ([key, value]) => isConfigKey(key)
            ? isConfigValue(key, String(value))
            : true
    )
}

/**
 * Returns available values for the specified property.
 * @param key The config property.
 * @param fallbackDefault If `true`, the default value will be used when the value is `undefined`. Default `true`.
 */
export function configValueList<T extends ConfigKey>(key: T): readonly string[] | undefined {
    /**
     * Represents allowed values for each config property.
     */
    const configAvailable: Partial<Record<ConfigKey, readonly string[] | (() => readonly string[])>> = {
        color: colorTypeList,
        filter: filterNameList,
        target: Plugins.targetList,
        sort: Sorting.sortNameList,
        style: Styling.styleNameList,
        decor: Styling.decorNameList,
    }
    const val = configAvailable[key] as readonly string[] | (() => readonly string[]) | undefined
    const choices = (typeof val === "function" ? val() : val)
    return choices
}

export function configValuePutChoices<T extends ConfigKey>(option: Option, key: T): Option {
    const list = configValueList(key)
    if (list !== undefined) {
        option.choices(list)
    }
    option.default(configManager.get(key))
    return option
}

/**
 * File-specific actions container.
 */
export class ConfigManager {

    constructor(
        public readonly filePath: string
    ) { }

    /**
     * Do not change this value directly.
     * @todo Make private.
     * @see {@link configManager}.
     */
    private data = {} as Partial<Config>

    dataRaw(): unknown {
        return structuredClone(this.data)
    }

    entries() {
        const obj = this.dataRaw()
        if (obj?.constructor !== Object) {
            return
        }
        return Object.entries(obj)
    }

    /**
     * Loads the config from the file to {@link configManager.data}. If the data is not valid, throws an error without loading.
     * @returns `undefined` if the config file does not exist.
     */
    load() {
        const parsed: unknown | undefined = existsSync(this.filePath) ? propertiesFile.parse(readFileSync(this.filePath).toString()) : undefined
        if (parsed === undefined) {
            return this
        }
        if (!isConfigPartial(parsed)) {
            throw new TypeError(`Invalid config.`, { cause: parsed })
        }
        Object.assign(this.data, parsed)
        return this
    }

    /**
     * Saves the partial config to the file. If there are no settings, the file will be deleted, if exists.
     */
    save() {
        if (Object.keys(this.data).length === 0) {
            if (existsSync(this.filePath)) {
                rmSync(this.filePath)
            }
            return this
        }

        const strmap = Object.fromEntries(Object.entries(this.data).map(([k, v]) => [k, String(v)]))
        writeFileSync(this.filePath, propertiesFile.stringify(strmap)!)
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
     * @returns An array of properties which defined in the configuration file.
     */
    definedKeys(): ConfigKey[] {
        const keys = Object.keys(this.data) as ConfigKey[]
        return keys.filter(k => this.data[k] !== undefined)
    }

    /**
     * @param key The config property.
     * @param defs If `true`, the default value will be used when the value is `undefined`. Default `true`.
     * @returns The value for the specified property.
     */
    get<KeyT extends ConfigKey>(key: KeyT, defs: boolean = true): ConfigValue<KeyT, typeof defs> {
        const value: Config[KeyT] | undefined = this.data[key]
        if (defs && value === undefined) {
            return configDefault[key]
        }
        return value
    }

    /**
     * @param key The config property.
     * @param defs If `true`, the default value will be used when the value is `undefined`. Default `true`.
     * @returns A string in the `"key=value"` format, if the property is specified.
     * Otherwise in format `"key=value\nkey=value\n..."` without the '\n' ending.
     */
    getPairString<KeyT extends ConfigKey>(key?: KeyT, defs: boolean = true): string {
        if (key === undefined) {
            return configKeyList.map((key) => this.getPairString(key as KeyT, defs)).filter(Boolean).join('\n')
        }
        const val = this.get(key, defs)
        return val ? `${key}=${val}` : ''
    }
}

/**
 * File-specific actions container. Contains get, set, unset, save, load and other configuration actions.
 */
export const configManager = new ConfigManager(configFilePath)
