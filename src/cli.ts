import fs from "fs";
import { Chalk, ColorSupportLevel } from "chalk";
import { Argument, InvalidArgumentError, Option, Command } from "commander";
import { FileInfo, FilterName, scanProject, Sorting, Styling, Plugins, Config } from "./index.js";

/**
 * Prepare for {@link program}.parse().
 */
export async function programInit() {
	Config.configManager.load()
	await Plugins.BuiltIns
	program.parseOptions(process.argv)
	const flags: ProgramOptions = program.optsWithGlobals()
	await Plugins.loadPlugins(flags.plugin)
	optionsInit()
	program.parse()
}

/**
 * Command-line entire program flags.
 */
export interface ProgramOptions {
	plugin: string[]
	noColor: boolean,
	color: string,
}

/**
 * Command-line 'scan' command flags.
 */
export interface ScanOptions extends ProgramOptions {
	target: string,
	filter: FilterName,
	sort: Sorting.SortName,
	style: Styling.StyleName
}

export const optionPlugin = new Option('--plugin <modules...>')
export const optionNoColor = new Option("--no-color").default(false)
export const optionColor = new Option("--color <level>")

/**
 * `view-ignored` command-line programl
 */
export const program = new Command()
	.addOption(optionPlugin)
	.addOption(optionColor)
	.addOption(optionNoColor)

export const scanOptionTarget = new Option("--target <ignorer>")
export const scanOptionFilter = new Option("--filter <filter>")
export const scanOptionSort = new Option("--sort <sorter>")
export const scanOptionStyle = new Option("--style <style>")

export function optionsInit() {
	optionColor.choices(Config.configValueList("color"))
	optionColor.default(Config.configManager.get("color"))

	scanOptionTarget.choices(Config.configValueList("target"))
	scanOptionTarget.default(Config.configManager.get("target"))

	scanOptionFilter.choices(Config.configValueList("filter"))
	scanOptionFilter.default(Config.configManager.get("filter"))

	scanOptionSort.choices(Config.configValueList("sort"))
	scanOptionSort.default(Config.configManager.get("sort"))

	scanOptionStyle.choices(Config.configValueList("style"))
	scanOptionStyle.default(Config.configManager.get("style"))

	scanProgram
		.addOption(optionPlugin)
		.addOption(optionNoColor)
		.addOption(optionColor)
		.addOption(scanOptionTarget)
		.addOption(scanOptionFilter)
		.addOption(scanOptionSort)
		.addOption(scanOptionStyle)
}

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
