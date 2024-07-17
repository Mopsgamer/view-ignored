import fs from "fs";
import { Chalk, ColorSupportLevel } from "chalk";
import { Argument, InvalidArgumentError, Option, Command } from "commander";
import { FileInfo, FilterName, scanProject, Sorting, Styling, Binding } from "./index.js";
import { configValues, configManager, ConfigKey, Config, configKeyList, configFilePath } from "./config.js";

/**
 * Command-line entire program flags.
 */
export interface ProgramOptions {
	plugins?: string[]
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
export const scanOptionColor = new Option("--color <level>").default(configManager.get("color"))
export const scanOptionTarget = new Option("--target <ignorer>").default(configManager.get("target"))
export const scanOptionFilter = new Option("--filter <filter>").default(configManager.get("filter"))
export const scanOptionSort = new Option("--sort <sorter>").default(configManager.get("sort"))
export const scanOptionStyle = new Option("--style <style>").default(configManager.get("style"))

export function refreshOptions() {
	const values = configValues()
	scanOptionColor.choices(values.color)
	scanOptionTarget.choices(values.target)
	scanOptionFilter.choices(values.filter)
	scanOptionSort.choices(values.sort)
	scanOptionStyle.choices(values.style)
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
 * @see {@link configKeyList}
 */
export const argConfigKey = new Argument('[key]', 'setting').choices(configKeyList)

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
	if (!configKeyList.includes(key as ConfigKey)) {
		throw new InvalidArgumentError(`Allowed config properties are ${configKeyList.join(', ')}. Got ${key}.`)
	}
	return key;
}

export function parseArgKeyVal(pair: string): [ConfigKey, Config[ConfigKey]] {
	const result = pair.split('=') as [ConfigKey, Config[ConfigKey]]
	if (result.length !== 2) {
		throw new InvalidArgumentError(`Invalid syntax. Expected 'setting=value'. Got '${pair}'.`)
	}
	const [key, val] = result
	parseArgKey(key)
	const values = configValues()
	if (!values[key].includes(val as Config[ConfigKey] as never)) {
		throw new InvalidArgumentError(`Allowed config properties are ${values[key].join(', ')}. Got '${val}'.`)
	}
	return result
}


/**
 * Prepare for {@link program}.parse().
 */
export async function programInit() {
	configManager.load()
    await Binding.BuiltIns
	program.parseOptions(process.argv)
	const flags: ProgramOptions = program.optsWithGlobals()
	await Binding.loadPlugins(flags.plugins)
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
	const bind = Binding.targetGet(flags.target)!
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
	console.log(`${fileInfoList.length} files listed for ${bind.name} (${flags.filter}).\n`)
	const infoSymbol = Styling.styleCondition(flags.style, { ifEmoji: 'ℹ️', ifNerd: '\ue66a', postfix: ' ' })
	console.log(`${chalk.blue(infoSymbol)}You can use '${chalk.magenta(bind.testCommad ?? "")}' to check if the list is valid.\n`)
}

/**
 * Command-line 'config path' command action.
 */
export function actionCfgPath(): void {
	console.log(configFilePath)
}

/**
 * Command-line 'config reset' command action
 */
export function actionCfgReset(): void {
	configManager.unset().save()
	console.log(configManager.getPairString())
}

/**
 * Command-line 'config set' command action
 */
export function actionCfgSet(pair: [ConfigKey, Config[ConfigKey]]): void {
	const [key, val] = pair
	configManager.set(key, val).save()
	console.log(configManager.getPairString(key))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgUnset(key: ConfigKey | undefined): void {
	if (key !== undefined) {
		configManager.unset(key).save()
	}
	console.log(configManager.getPairString(key))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgGet(key: ConfigKey | undefined, options: { safe?: boolean }): void {
	console.log(configManager.getPairString(key, options.safe ?? false))
}
