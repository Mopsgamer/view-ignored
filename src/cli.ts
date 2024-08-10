import fs from "fs";
import { Chalk, ChalkInstance, ColorSupportLevel } from "chalk";
import { Argument, InvalidArgumentError, Option, Command } from "commander";
import * as Config from "./config.js";
import { BuiltIns, loadPluginsQueue, targetGet } from "./browser/binds/index.js";
import { decorCondition, DecorName, formatFiles, StyleName } from "./browser/styling.js";
import { SortName } from "./browser/sorting.js";
import { ErrorNoSources, FilterName, scanProject, Sorting } from "./lib.js";
import { formatConfigConflicts } from "./styling.js";
import ora from "ora";
import packageJSON from "../package.json" with {type: "json"}

export const { version } = packageJSON;

/**
 * Use it instead of {@link program}.parse()
 */
export async function programInit() {
    optionsInit()
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
        await loadPluginsQueue(flags.plugins)
    } catch {
        return
    }
    program.parse()
}

/** Chalk, but configured by view-ignored cli. */
export function getChalk(flags: ProgramFlags): ChalkInstance {
    const colorLevel = (flags.noColor ? 0 : Math.max(0, Math.min(Number(flags.color ?? 3), 3))) as ColorSupportLevel
    const chalk = new Chalk({ level: colorLevel })
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
export interface ScanFlags extends ProgramFlags {
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
    .version('v' + version, '-v')
    .addOption(new Option("--no-color", 'force disable colors').default(false))

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
 * Init the command-line, parse arguments and invoke the program.
 */
export function optionsInit() {
    Config.configValueLinkCliOption(program, new Option('--plugins <modules...>', 'import modules to modify behavior').argParser(parseArgArrStr), "plugins")
    Config.configValueLinkCliOption(program, new Option("--color <level>", 'the interface color level'), "color")
    Config.configValueLinkCliOption(program, new Option("--decor <decor>", "the interface decorations"), "decor")
    Config.configValueLinkCliOption(scanProgram, new Option('-p, --parsable [parsable]', "print parsable text").argParser(parseArgBool), "parsable")
    Config.configValueLinkCliOption(scanProgram, new Option("-t, --target <ignorer>", 'the scan target'), "target")
    Config.configValueLinkCliOption(scanProgram, new Option("--filter <filter>", 'filter results'), "filter")
    Config.configValueLinkCliOption(scanProgram, new Option("--sort <sorter>", 'sort results'), "sort")
    Config.configValueLinkCliOption(scanProgram, new Option("--style <style>", 'results view mode'), "style")
    Config.configValueLinkCliOption(scanProgram, new Option("--depth <depth>", 'the max results depth').argParser(parseArgInt), "depth")
    Config.configValueLinkCliOption(scanProgram, new Option("--show-sources [show]", 'show scan sources').argParser(parseArgBool), "showSources")
}

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
        throw new InvalidArgumentError(`Excpected 'key=value'.`)
    }
    if (!Config.isConfigKey(key)) {
        throw new InvalidArgumentError(`Got invalid key '${key}'. Allowed config keys are ${Config.configKeyList.join(', ')}.`)
    }
    const { parseArg } = Config.configValueGetCliOption(key) ?? {}
    const val = parseArg?.(result[1], undefined) ?? result[1]

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
export async function actionScan(flags: ScanFlags): Promise<void> {
    const cwd = process.cwd()
    const start = Date.now()
    const chalk = getChalk(flags)

    const fileInfoListP = scanProject(flags.target, { filter: flags.filter, maxDepth: flags.depth })
        .catch((error) => {
            spinner.stop()
            spinner.clear()
            if (!(error instanceof ErrorNoSources)) {
                throw error
            }
            console.error(`Bad sources for ${flags.target}: ${ErrorNoSources.walk(flags.target)}`)
            process.exit(1)
        })

    if (flags.parsable) {
        console.log((await fileInfoListP).map(fi => fi.filePath + (flags.showSources ? '<' + fi.source.sourcePath : '')).join('|'))
        return
    }

    const spinner = ora({ text: cwd, color: 'white' })
    spinner.start()

    const fileInfoList = await fileInfoListP
    const filePathList = fileInfoList.map(String)
    spinner.suffixText = "Generating...";

    const sorter = Sorting[flags.sort]
    const cacheEditDates = new Map<string, number>(filePathList.map(
        filePath => [filePath, fs.statSync(filePath).mtime.getTime()])
    )
    const lookedSorted = fileInfoList.sort((a, b) => sorter(a.toString(), b.toString(), cacheEditDates))

    let message = ''
    message += formatFiles(lookedSorted, { chalk, style: flags.style, decor: flags.decor, showSources: flags.showSources })
    message += '\n'
    const time = Date.now() - start
    const checkSymbol = decorCondition(flags.decor, { ifEmoji: '✅', ifNerd: '\uf00c', postfix: ' ' })
    const fastSymbol = decorCondition(flags.decor, { ifEmoji: '⚡', ifNerd: '\udb85\udc0c' })
    message += `${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.`
    message += '\n'
    const bind = targetGet(flags.target)!
    const name = typeof bind.name === "string" ? bind.name : decorCondition(flags.decor, bind.name)
    message += `${fileInfoList.length} files listed for ${name} (${flags.filter}).`
    message += '\n'
    const infoSymbol = decorCondition(flags.decor, { ifEmoji: 'ℹ️', ifNerd: '\ue66a', postfix: ' ' })
    if (bind.testCommand) {
        message += '\n'
        message += `${chalk.blue(infoSymbol)}You can use '${chalk.magenta(bind.testCommand)}' to check if the list is valid.`
    }
    message += '\n'
    spinner.suffixText = '\n' + message;
    spinner.succeed()
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
