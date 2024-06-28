import { ColorSupportLevel } from "chalk"
import { FilterName, filterNameList, targetBindMap } from "./browser/index.js"
import { SortName, StyleName, sortNameList, styleNameList } from "./browser/tools/index.js"
import * as os from "os";
import propertiesFile from "properties";
import path from "path"
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs"

export const configFileName = ".view-ignored"
export const configFilePath = path.join(os.homedir(), configFileName)

export const configKeyList = ["color", "target", "filter", "sort", "style"] as const satisfies readonly (keyof Config)[]
export type ConfigKey = typeof configKeyList[number] & keyof Config
export type Config = {
    color: `${ColorSupportLevel}`,
    target: string,
    filter: FilterName,
    sort: SortName,
    style: StyleName,
}

export const configDefault: Config = {
    color: "3",
    target: "git",
    filter: "included",
    sort: "firstFolders",
    style: "treeEmoji",
}
export const configValues = {
    color: ["1", "2", "3", "4"],
    target: Array.from(targetBindMap.keys()),
    filter: filterNameList,
    sort: sortNameList,
    style: styleNameList
} as const

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

export const configManager = {
    /**
     * Contains custom settings.
     */
    data: {} as Partial<Config>,
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
     * Saves config to the file. If there are no settings, the file will be deleted, if exists.
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
    set<T extends ConfigKey>(key: T, value: Config[T]) {
        this.data[key] = value
        return this
    },
    /**
     * Deletes specific key or all keys from config.
     * @param key Config property name.
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
     * Returns specific property value.
     * @param key Config property name.
     * @param fallbackDefault If `true`, default config value will be used when property from config file is `undefined`. Default `true`.
     */
    get<T extends ConfigKey, UseDefault extends boolean>(key: T, fallbackDefault?: UseDefault) {
        const useDefault = fallbackDefault ?? true
        const value: Config[T] | undefined = this.data[key]
        if (useDefault && value === undefined) {
            return configDefault[key]
        }
        return value
    },
    /**
     * If key specified, returns string in format `"key=value"`. Otherwise, returns string with all pairs, separated with '\n' in format `"key=value\nkey=value\n..."` without new line ending.
     * @param key Config property name.
     * @param fallbackDefault If `true`, default config value will be used when property from config file is `undefined`. Default `true`.
     */
    getPairString<T extends ConfigKey>(key?: T, fallbackDefault: boolean = true): string {
        if (key === undefined) {
            return configKeyList.map((key) => this.getPairString(key as T, fallbackDefault)).filter(Boolean).join('\n')
        }
        const val = this.get(key, fallbackDefault)
        return val ? `${key}=${val}` : ''
    },
} as const
