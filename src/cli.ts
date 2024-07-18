import fs from "fs";
import { Chalk, ColorSupportLevel } from "chalk";
import { Argument, InvalidArgumentError, Option, Command } from "commander";
import { FileInfo, FilterName, scanProject, Sorting, Styling, Plugins, Config } from "./index.js";

/**
 * Command-line entire program flags.
 */
export interface ProgramOptions {
	plugin?: string[]
}

/**
 * Command-line 'scan' command flags.
 */
export interface ScanOptions extends ProgramOptions {
	noColor: boolean,
	color: string,
	target: string,
	filter: FilterName,
	sort: Sorting.SortName,
	style: Styling.StyleName
}

export const optionPlugin = new Option('--plugin [modules...]')

/**
 * `view-ignored` command-line programl
 */
export const program = new Command()
	.addOption(optionPlugin)

export const scanOptionNoColor = new Option("--no-color")
export const scanOptionColor = new Option("--color <level>").default(Config.configManager.get("color"))
export const scanOptionTarget = new Option("--target <ignorer>").default(Config.configManager.get("target"))
export const scanOptionFilter = new Option("--filter <filter>").default(Config.configManager.get("filter"))
export const scanOptionSort = new Option("--sort <sorter>").default(Config.configManager.get("sort"))
export const scanOptionStyle = new Option("--style <style>").default(Config.configManager.get("style"))

export function refreshOptions() {
	scanOptionColor.choices(Config.configValueList("color"))
	scanOptionTarget.choices(Config.configValueList("target"))
	scanOptionFilter.choices(Config.configValueList("filter"))
	scanOptionSort.choices(Config.configValueList("sort"))
	scanOptionStyle.choices(Config.configValueList("style"))
}

/**
 * Command-line 'scan' command.
 */
export const scanProgram = program
	.command("scan")
	.aliases(['sc'])
	.description('get ignored paths')
	.addOption(optionPlugin)
	.addOption(scanOptionNoColor)
	.addOption(scanOptionColor)
	.addOption(scanOptionTarget)
	.addOption(scanOptionFilter)
	.addOption(scanOptionSort)
	.addOption(scanOptionStyle)
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
export const argConfigKeyVal = new Argument('<pair>', 'pair "key=value"').argParser(parseArgKeyVal)
/**
 * Command-line argument: config property.
 * @see {@link Config.configKeyList}
 */
export const argConfigKey = new Argument('[key]', 'setting').choices(Config.configKeyList)

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
	.option('--safe', 'use default value(s) as fallback for printing')
	.addArgument(argConfigKey)
	.action(actionCfgGet)

export function parseArgKey(key: string): string {
	if (!Config.isConfigKey(key)) {
		throw new InvalidArgumentError(`Allowed config properties are ${Config.configKeyList.join(', ')}. Got ${key}.`)
	}
	return key;
}

export function parseArgKeyVal(pair: string): Config.ConfigPair {
	const result = pair.split('=') as Config.ConfigPair
	if (result.length !== 2) {
		throw new InvalidArgumentError(`Invalid syntax. Expected 'setting=value'. Got '${pair}'.`)
	}
	const [key, val] = result
	parseArgKey(key)
	if (!Config.isConfigValue(key, val)) {
		throw new InvalidArgumentError(`Allowed config properties are ${Config.configValueList(key).join(', ')}. Got '${val}'.`)
	}
	return result
}


/**
 * Prepare for {@link program}.parse().
 */
export async function programInit() {
	Config.configManager.load()
    await Plugins.BuiltIns
	program.parseOptions(process.argv)
	const flags: ProgramOptions = program.optsWithGlobals()
	await Plugins.loadPlugins(flags.plugin)
    refreshOptions()
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(flags: ScanOptions): Promise<void> {
	const start = Date.now()
	const colorLevel = (flags.noColor ? 0 : Math.max(0, Math.min(Number(flags.color ?? 3), 3))) as ColorSupportLevel
	/** Chalk, but configured by view-ignored cli. */
	const chalk = new Chalk({ level: colorLevel })

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
	const bind = Plugins.targetGet(flags.target)!
	const lookedSorted = fileInfoList.sort((a, b) => sorter(
		a.toString(), b.toString(),
		cacheEditDates.get(a)!, cacheEditDates.get(b)!
	))
	console.log(process.cwd())
	Styling.Styles[flags.style](chalk, lookedSorted, flags.style, flags.filter)
	const time = Date.now() - start
	console.log('')
	const checkSymbol = Styling.styleCondition(flags.style, { ifEmoji: '✅', ifNerd: '\uf00c', postfix: ' ' })
	const fastSymbol = Styling.styleCondition(flags.style, { ifEmoji: '⚡', ifNerd: '\udb85\udc0c' })
	console.log(`${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.\n`)
	const name = typeof bind.name === "string" ? bind.name : Styling.styleCondition(flags.style, bind.name)
	console.log(`${fileInfoList.length} files listed for ${name} (${flags.filter}).\n`)
	const infoSymbol = Styling.styleCondition(flags.style, { ifEmoji: 'ℹ️', ifNerd: '\ue66a', postfix: ' ' })
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
export function actionCfgSet(pair: Config.ConfigPair): void {
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
export function actionCfgGet(key: Config.ConfigKey | undefined, options: { safe?: boolean }): void {
	console.log(Config.configManager.getPairString(key, options.safe ?? false))
}
