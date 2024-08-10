import fs from "fs";
import { Chalk, ChalkInstance, ColorSupportLevel } from "chalk";
import { Argument, InvalidArgumentError, Option, Command } from "commander";
import * as Config from "./config.js";
import { BuiltIns, loadPluginsQueue, targetGet } from "./browser/binds/index.js";
import { decorCondition, DecorName, formatFiles, StyleName } from "./browser/styling.js";
import { SortName } from "./browser/sorting.js";
import { ErrorNoSources, FilterName, scanProject, Sorting } from "./lib.js";
import { boxError, BoxOptions, formatConfigConflicts } from "./styling.js";
import ora from "ora";
import packageJSON from "../package.json" with {type: "json"}
import { format } from "util";

export const { version } = packageJSON;

export function logError(message: string, options?: BoxOptions) {
    console.log(boxError(message, { noColor: getColorLevel(program.opts()) === 0, ...options }))
}

/**
 * Use it instead of {@link program}.parse()
 */
export async function programInit() {
    Config.configManager.load()
    program.version('v' + version, '-v')
    program.addOption(new Option("--no-color", 'force disable colors').default(false))
    Config.configValueLinkCliOption("plugins", program, new Option('--plugins <modules...>', 'import modules to modify behavior'), parseArgArrStr)
    Config.configValueLinkCliOption("color", program, new Option("--color <level>", 'the interface color level'), parseArgInt)
    Config.configValueLinkCliOption("decor", program, new Option("--decor <decor>", "the interface decorations"))
    Config.configValueLinkCliOption("parsable", scanProgram, new Option('-p, --parsable [parsable]', "print parsable text"), parseArgBool)
    Config.configValueLinkCliOption("target", scanProgram, new Option("-t, --target <ignorer>", 'the scan target'))
    Config.configValueLinkCliOption("filter", scanProgram, new Option("--filter <filter>", 'filter results'))
    Config.configValueLinkCliOption("sort", scanProgram, new Option("--sort <sorter>", 'sort results'))
    Config.configValueLinkCliOption("style", scanProgram, new Option("--style <style>", 'results view mode'))
    Config.configValueLinkCliOption("depth", scanProgram, new Option("--depth <depth>", 'the max results depth'), parseArgInt)
    Config.configValueLinkCliOption("showSources", scanProgram, new Option("--show-sources [show]", 'show scan sources'), parseArgBool)
    program.parseOptions(process.argv)
    const flags = program.opts<ProgramFlags>()
    const chalk = getChalk(flags)
    try {
        Config.configManager.load()
    } catch (error) {
        formatConfigConflicts(chalk, flags.decor, error)
        return
    }
    try {
        await BuiltIns
        const configPlugins = Config.configManager.get('plugins')
        const loaded = await loadPluginsQueue(flags.plugins)
        for (const load of loaded) {
            if (!load.isLoaded) {
                logError(format(load.exports), {
                    title: `Unable to load plugin '${load.moduleName}' ` + (configPlugins.includes(load.moduleName)
                        ? '(imported by ' + Config.configManager.filePath + ')'
                        : '(imported by --plugins option)')
                })
            }
        }
    } catch (reason) {
        logError(format(reason))
        process.exit(1)
    }
    program.parse()
}

/** Chalk, but configured by view-ignored cli. */
export function getColorLevel(flags: ProgramFlags): ColorSupportLevel {
    const colorLevel = (flags.noColor ? 0 : Math.max(0, Math.min(Number(flags.color ?? 3), 3))) as ColorSupportLevel
    return colorLevel
}

/** Chalk, but configured by view-ignored cli. */
export function getChalk(flags: ProgramFlags): ChalkInstance {
    const chalk = new Chalk({ level: getColorLevel(flags) })
    return chalk
}

/**
 * Command-line entire program flags.
 */
export interface ProgramFlags {
    plugins: string[]
    noColor: boolean
    color: string
    decor: DecorName
}

/**
 * Command-line 'scan' command flags.
 */
export interface ScanFlags {
    target: string
    filter: FilterName
    sort: SortName
    style: StyleName
    showSources: boolean
    depth: number
    parsable: boolean
}

/**
 * Command-line 'cfg get' command flags.
 */
export interface ConfigGetFlags {
    real: boolean
}

/**
 * `view-ignored` command-line programl
 */
export const program = new Command()

/**
 * Command-line 'scan' command.
 */
export const scanProgram = program
    .command("scan")
    .aliases(['sc'])
    .description('get ignored/included paths')
    .action(actionScan)

/**
* Command-line 'config' command.
*/
export const cfgProgram = program
    .command("config")
    .alias('cfg')
    .description('cli config manipulation')

/**
 * Command-line argument: key=value pair.
 * @see {@link parseArgKeyVal}
 */
export const argConfigKeyVal = new Argument('[pair]', "the configuration entry key=value'").argParser(parseArgKeyVal)
/**
 * Command-line argument: config property.
 * @see {@link Config.configKeyList}
 */
export const argConfigKey = new Argument('[key]', 'the configuration setting name').choices(Config.configKeyList)

export const cfgGetOption = new Option('--real', 'use default value(s) as fallback').default(false)

cfgProgram
    .command('path').description('print the config file path')
    .action(actionCfgPath)
cfgProgram
    .command('set').description("set config property using syntax 'key=value'")
    .addArgument(argConfigKeyVal)
    .action(actionCfgSet)
cfgProgram
    .command('unset').description("delete configuration value if cpecified, otherwise delete entire config")
    .addArgument(argConfigKey)
    .action(actionCfgUnset)
cfgProgram
    .command('get').description('print configuration value(s). You can use --real option to view real values')
    .addOption(cfgGetOption)
    .addArgument(argConfigKey)
    .action(actionCfgGet)

export function parseArgArrStr(arg: string): string[] {
    return arg.split(/[ ,|]/).filter(Boolean)
}

export function parseArgBool(arg: string): boolean {
    if (!Config.boolValues.includes(arg)) {
        throw new InvalidArgumentError(`Got invalid value '${arg}'. Should be a boolean.`)
    }
    return Config.trueValues.includes(arg)
}

export function parseArgInt(arg: string): number {
    const num = parseInt(arg)
    if (!Number.isInteger(num)) {
        throw new InvalidArgumentError(`Got invalid value '${num}'. Should be an integer.`)
    }
    return num
}

export function parseArgKey(key: string): Config.ConfigKey {
    if (!Config.isConfigKey(key)) {
        throw new InvalidArgumentError(`Got invalid key '${key}'. Allowed config keys are ${Config.configKeyList.join(', ')}.`)
    }
    return key;
}

export function parseArgKeyVal(pair: string): Config.ConfigPair {
    const result = pair.split('=') as [string, string]
    const [key] = result
    if (result.length !== 2) {
        throw new InvalidArgumentError(`Expected 'key=value'.`)
    }
    if (!Config.isConfigKey(key)) {
        throw new InvalidArgumentError(`Got invalid key '${key}'. Allowed config keys are ${Config.configKeyList.join(', ')}.`)
    }
    const option = Config.configValueGetCliOption(key)!
    const val = option.parseArg?.(result[1], undefined) ?? result[1]

    if (!Config.isConfigValue(key, val)) {
        const list = Config.configValueList(key)
        if (list === undefined) {
            throw new InvalidArgumentError(`Invalid value '${val}' for the key '${key}'.`)
        }
        if (Array.isArray(list)) {
            throw new InvalidArgumentError(`Invalid value '${val}' for the key '${key}'. Allowed config values are ${list.join(', ')}`)
        }
        throw new InvalidArgumentError(`Invalid value '${val}' for the key '${key}'. ${list}`)
    }
    return [key, val] as [Config.ConfigKey, Config.ConfigValue]
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(): Promise<void> {
    const flagsGlobal: ProgramFlags & ScanFlags = scanProgram.optsWithGlobals()
    const cwd = process.cwd()
    const start = Date.now()
    const chalk = getChalk(program.opts())

    const fileInfoListP = scanProject(flagsGlobal.target, { filter: flagsGlobal.filter, maxDepth: flagsGlobal.depth })
        .catch((error) => {
            spinner.stop()
            spinner.clear()
            if (!(error instanceof ErrorNoSources)) {
                throw error
            }
            console.error(`Bad sources for ${flagsGlobal.target}: ${ErrorNoSources.walk(flagsGlobal.target)}`)
            process.exit(1)
        })

    if (flagsGlobal.parsable) {
        console.log((await fileInfoListP).map(fi => fi.filePath + (flagsGlobal.showSources ? '<' + fi.source.sourcePath : '')).join('|'))
        return
    }

    const spinner = ora({ text: cwd, color: 'white' })
    spinner.start()

    const fileInfoList = await fileInfoListP
    const filePathList = fileInfoList.map(String)
    spinner.suffixText = "Generating...";

    const sorter = Sorting[flagsGlobal.sort]
    const cacheEditDates = new Map<string, number>(filePathList.map(
        filePath => [filePath, fs.statSync(filePath).mtime.getTime()])
    )
    const lookedSorted = fileInfoList.sort((a, b) => sorter(a.toString(), b.toString(), cacheEditDates))

    let message = ''
    message += formatFiles(lookedSorted, { chalk, style: flagsGlobal.style, decor: flagsGlobal.decor, showSources: flagsGlobal.showSources })
    message += '\n'
    const time = Date.now() - start
    const checkSymbol = decorCondition(flagsGlobal.decor, { ifEmoji: '✅', ifNerd: '\uf00c', postfix: ' ' })
    const fastSymbol = decorCondition(flagsGlobal.decor, { ifEmoji: '⚡', ifNerd: '\udb85\udc0c' })
    message += `${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.`
    message += '\n'
    const bind = targetGet(flagsGlobal.target)!
    const name = typeof bind.name === "string" ? bind.name : decorCondition(flagsGlobal.decor, bind.name)
    message += `${fileInfoList.length} files listed for ${name} (${flagsGlobal.filter}).`
    message += '\n'
    const infoSymbol = decorCondition(flagsGlobal.decor, { ifEmoji: 'ℹ️', ifNerd: '\ue66a', postfix: ' ' })
    if (bind.testCommand) {
        message += '\n'
        message += `${chalk.blue(infoSymbol)}You can use '${chalk.magenta(bind.testCommand)}' to check if the list is valid.`
    }
    message += '\n'
    spinner.stop()
    spinner.clear()
    console.log(cwd + '\n' + message)
}

/**
 * Command-line 'config path' command action.
 */
export function actionCfgPath(): void {
    console.log(Config.configFilePath)
}

/**
 * Command-line 'config set' command action
 */
export function actionCfgSet(pair?: Config.ConfigPair): void {
    if (pair === undefined) {
        console.log(`Allowed config keys are ${Config.configKeyList.join(', ')}.`)
        return
    }
    const [key, val] = pair
    Config.configManager.set(key, val).save()
    console.log(Config.configManager.getPairString(key))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgUnset(key: Config.ConfigKey | undefined): void {
    if (key === undefined) {
        console.log('Configuration file has been completely deleted.')
    }
    Config.configManager.unset(key).save()
    console.log(Config.configManager.getPairString(key))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgGet(key: Config.ConfigKey | undefined, options: ConfigGetFlags): void {
    console.log(Config.configManager.getPairString(key, options.real))
}
