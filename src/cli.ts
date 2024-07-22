import fs from "fs";
import { Chalk, ChalkInstance, ColorSupportLevel } from "chalk";
import { Argument, InvalidArgumentError, Option, Command } from "commander";
import * as Config from "./config.js";
import { BuiltIns, loadPlugins, targetGet } from "./browser/binds/index.js";
import { decorCondition, DecorName, formatFiles, StyleName } from "./browser/styling.js";
import { SortName } from "./browser/sorting.js";
import { FileInfo, FilterName, scanProject, Sorting } from "./lib.js";
import { formatConfigConflicts } from "./styling.js";

/**
 * Prepare for {@link program}.parse().
 */
export async function programInit() {
	const flags: ProgramFlags = program.optsWithGlobals()
	const chalk = getChalk(flags)
	try {
		Config.configManager.load()
	} catch (error) {
		formatConfigConflicts(chalk, flags.decor, error)
		return
	}
	await BuiltIns
	program.parseOptions(process.argv)
	await loadPlugins(flags.plugin)
	optionsInit()
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
	plugin: string[]
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
}

/**
 * Command-line 'cfg get' command flags.
 */
export interface ConfigGetFlags {
	defs: boolean
}

/**
 * `view-ignored` command-line programl
 */
export const program = new Command()
	.addOption(new Option('--plugin <modules...>'))
	.addOption(new Option("--no-color").default(false))

/**
 * Command-line 'scan' command.
 */
export const scanProgram = program
	.command("scan")
	.aliases(['sc'])
	.description('get ignored paths')
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
	Config.configValuePutChoices(program, new Option("--color <level>"), "color")
	Config.configValuePutChoices(program, new Option("--decor <decor>"), "decor")
	Config.configValuePutChoices(scanProgram, new Option("--target <ignorer>"), "target")
	Config.configValuePutChoices(scanProgram, new Option("--filter <filter>"), "filter")
	Config.configValuePutChoices(scanProgram, new Option("--sort <sorter>"), "sort")
	Config.configValuePutChoices(scanProgram, new Option("--style <style>"), "style")
	Config.configValuePutChoices(scanProgram, new Option("--show-sources").argParser(parseArgBool), "showSources")
}

/**
 * Command-line argument: key=value pair.
 * @see {@link parseArgKeyVal}
 */
export const argConfigKeyVal = new Argument('[pair]', 'pair "key=value"').argParser(parseArgKeyVal)
/**
 * Command-line argument: config property.
 * @see {@link Config.configKeyList}
 */
export const argConfigKey = new Argument('[key]', 'setting').choices(Config.configKeyList)

export const cfgGetOption = new Option('--defs', 'use default value(s) as fallback for printing').default(false)

cfgProgram
	.command('path').description('print the config file path')
	.action(actionCfgPath)
cfgProgram
	.command('reset').description('reset config by deleting the file. alias for no-prop unset')
	.action(actionCfgReset)
cfgProgram
	.command('set').description('set config property using syntax "key=value"')
	.addArgument(argConfigKeyVal)
	.action(actionCfgSet)
cfgProgram
	.command('unset').description("unset all configuration values or a specific one")
	.addArgument(argConfigKey)
	.action(actionCfgUnset)
cfgProgram
	.command('get').description('print a list of all configuration values or a specific one')
	.addOption(cfgGetOption)
	.addArgument(argConfigKey)
	.action(actionCfgGet)

export function parseArgBool(arg: string): "true" | "false" {
	return String(!!arg) as "true" | "false"
}

export function parseArgKey(key: string): Config.ConfigKey {
	if (!Config.isConfigKey(key)) {
		throw new InvalidArgumentError(`Got invalid key '${key}'. Allowed config keys are ${Config.configKeyList.join(', ')}.`)
	}
	return key;
}

export function parseArgKeyVal(pair: string): Config.ConfigPair {
	const result = pair.split('=') as [string, unknown]
	const r1num = Number(result[1])
	if (!isNaN(r1num)) {
		result[1] = r1num
	} else if (['true', 'false'].includes(result[1] as string)) {
		result[1] = result[1] === 'true'
	}
	if (result.length !== 2) {
		throw new InvalidArgumentError(`Invalid syntax. Expected 'setting=value'.`)
	}
	const [key, val] = result
	if (!Config.isConfigKey(key)) {
		throw new InvalidArgumentError(`Got invalid key '${key}'. Allowed config keys are ${Config.configKeyList.join(', ')}.`)
	}
	if (!Config.isConfigValue(key, val)) {
		const list = Config.configValueList(key)
		if (list === undefined) {
			throw new InvalidArgumentError(`Invalid value '${val}' for the key '${key}'.`)
		}
		throw new InvalidArgumentError(`Invalid value '${val}' for the key '${key}'. Allowed config values are ${list.join(', ')}`)
	}
	return result as [Config.ConfigKey, Config.ConfigValue]
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(flags: ScanFlags): Promise<void> {
	const start = Date.now()
	const chalk = getChalk(flags)

	const fileInfoList = await scanProject(flags.target, { filter: flags.filter })

	if (!fileInfoList) {
		console.error(`Bad source for ${flags.target}.`)
		process.exit(1)
	}

	const sorter = Sorting[flags.sort]
	const cacheEditDates = new Map<FileInfo, Date>()
	for (const look of fileInfoList) {
		cacheEditDates.set(look, fs.statSync(look.filePath).mtime)
	}
	const bind = targetGet(flags.target)!
	const lookedSorted = fileInfoList.sort((a, b) => sorter(
		a.toString(), b.toString(),
		cacheEditDates.get(a)!, cacheEditDates.get(b)!
	))
	console.log(process.cwd())
	formatFiles(lookedSorted, { chalk, style: flags.style, decor: flags.decor, showSources: flags.showSources })
	const time = Date.now() - start
	console.log()
	const checkSymbol = decorCondition(flags.decor, { ifEmoji: '✅', ifNerd: '\uf00c', postfix: ' ' })
	const fastSymbol = decorCondition(flags.decor, { ifEmoji: '⚡', ifNerd: '\udb85\udc0c' })
	console.log(`${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.\n`)
	const name = typeof bind.name === "string" ? bind.name : decorCondition(flags.decor, bind.name)
	console.log(`${fileInfoList.length} files listed for ${name} (${flags.filter}).\n`)
	const infoSymbol = decorCondition(flags.decor, { ifEmoji: 'ℹ️', ifNerd: '\ue66a', postfix: ' ' })
	console.log(`${chalk.blue(infoSymbol)}You can use '${chalk.magenta(bind.testCommand ?? "")}' to check if the list is valid.\n`)
}

/**
 * Command-line 'config path' command action.
 */
export function actionCfgPath(): void {
	console.log(Config.configFilePath)
}

/**
 * Command-line 'config reset' command action
 */
export function actionCfgReset(): void {
	Config.configManager.unset().save()
	console.log(Config.configManager.getPairString())
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
	if (key !== undefined) {
		Config.configManager.unset(key).save()
	}
	console.log(Config.configManager.getPairString(key))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgGet(key: Config.ConfigKey | undefined, options: ConfigGetFlags): void {
	console.log(Config.configManager.getPairString(key, options.defs))
}
