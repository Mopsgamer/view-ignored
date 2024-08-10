import { ColorSupportLevel } from "chalk"
import { FilterName, filterNameList, isFilterName, Plugins, Sorting, Styling } from "./browser/index.js"
import * as os from "os";
import * as yaml from "yaml";
import path from "path"
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs"
import { Command, Option } from "commander";

/**
 * Contains all color level names.
 */
export const colorTypeList = [0, 1, 2, 3] as const
/**
 * Contains all color level names as a type.
 */
export type ColorType = ColorSupportLevel
/**
 * Checks if the value is the {@link ColorType}.
 */
export function isColorType(value: unknown): value is ColorType {
    const num = Number(value)
    return Number.isFinite(num) && colorTypeList.includes(num as ColorType)
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
export const configKeyList = ["color", "target", "filter", "sort", "style", "decor", "depth", "showSources", "plugins", "parsable"] as const satisfies readonly (keyof Config)[]

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

export type ShowSourcesType = boolean

export function isShowSources(value: unknown): value is ShowSourcesType {
    return typeof value === "boolean"
}

/**
 * Checks if the value is the {@link Config} value for the specific {@link ConfigKey}.
 */
export function isConfigValue<T extends ConfigKey>(key: T, value: unknown): value is Config[T] {
    const c: Record<ConfigKey, (value: unknown) => boolean> = {
        parsable: v => typeof v === "boolean",
        plugins: v => Array.isArray(v) && v.every(p => typeof p === "string"),
        color: isColorType,
        target: t => Plugins.isTargetId(t) && Plugins.targetGet(t) !== undefined,
        filter: isFilterName,
        sort: Sorting.isSortName,
        style: Styling.isStyleName,
        decor: Styling.isDecorName,
        depth: Number.isInteger,
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
    parsable: boolean,
    plugins: string[],
    color: ColorType,
    target: string,
    filter: FilterName,
    sort: Sorting.SortName,
    style: Styling.StyleName,
    decor: Styling.DecorName,
    depth: number,
    showSources: ShowSourcesType,
}

/**
 * Command-line default config values.
 */
export const configDefault: Readonly<Config> = {
    parsable: false,
    plugins: [],
    color: 3,
    target: "git",
    filter: "included",
    sort: "firstFolders",
    style: "tree",
    decor: "normal",
    depth: Infinity,
    showSources: false
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
            ? isConfigValue(key, value)
            : true
    )
}

export const trueValues: string[] = ['true', 'on', 'yes', 'y', 'enable', 'enabled', '1']
export const falseValues: string[] = ['false', 'off', 'no', 'n', 'disable', 'disabled', '0']
export const boolValues = trueValues.concat(falseValues)

/**
 * @returns available values or requirement message for the specified property.
 * @param key The config property.
 * @param fallbackDefault If `true`, the default value will be used when the value is `undefined`. Default `true`.
 */
export function configValueList<T extends ConfigKey>(key: T): readonly string[] | string {
    const msg = {
        int: 'The value should be an integer.',
        bool: `The value should be a boolean. Available bool literals: ${boolValues.join(', ')}`,
        arrStr: `The value should be an array of a strings.`,
    }
    /**
     * Represents allowed values for each config property.
     */
    const configAvailable: Record<ConfigKey, readonly ConfigValue[] | string | (() => readonly ConfigValue[])> = {
        color: colorTypeList,
        filter: filterNameList,
        target: Plugins.targetList,
        sort: Sorting.sortNameList,
        style: Styling.styleNameList,
        decor: Styling.decorNameList,
        depth: msg.int,
        parsable: msg.bool,
        plugins: msg.arrStr,
        showSources: msg.bool,
    }
    const val = configAvailable[key] as readonly string[] | string | (() => readonly string[])
    const choices = (typeof val === "function" ? val() : val)
    return choices
}

const configCliOptMap = new Map<ConfigKey, Option>

export function configValueLinkCliOption<T extends ConfigKey>(command: Command, option: Option, key: T): Option {
    const list = configValueList(key)
    if (Array.isArray(list)) {
        option.choices(list)
    }
    option.default(configManager.get(key))
    command.addOption(option)
    configCliOptMap.set(key, option)
    return option
}

export function configValueGetCliOption<T extends ConfigKey>(key: T): Option | undefined {
    return configCliOptMap.get(key)
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
        const parsed: unknown = existsSync(this.filePath) ? yaml.parse(readFileSync(this.filePath).toString()) : undefined
        if (parsed === undefined) {
            return parsed
        }
        const obj = parsed as Record<string, string>
        if (obj?.constructor !== Object) {
            return this
        }
        for (const key in obj) {
            const element = obj[key];
            if (typeof element !== "string") {
                continue
            }
            if (element.startsWith('|')) {
                const array = element.split(',')
                array.shift();
                (parsed as Record<string, string[] | string>)[key] = array
            }
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

        writeFileSync(this.filePath, yaml.stringify(this.data))
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
        return val === undefined ? '' : `${key}=${val}`
    }
}

/**
 * File-specific actions container. Contains get, set, unset, save, load and other configuration actions.
 */
export const configManager = new ConfigManager(configFilePath)
