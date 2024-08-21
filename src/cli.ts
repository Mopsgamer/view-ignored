import fs from 'node:fs';
import {format} from 'node:util';
import * as process from 'node:process';
import {Chalk, type ChalkInstance, type ColorSupportLevel} from 'chalk';
import {
	Argument, InvalidArgumentError, Option, Command,
} from 'commander';
import ora from 'ora';
import * as Config from './config.js';
import {builtIns, loadPluginsQueue, targetGet} from './browser/binds/index.js';
import {
	decorCondition, type DecorName, formatFiles, type StyleName,
} from './browser/styling.js';
import {type SortName} from './browser/sorting.js';
import {
	ErrorNoSources, type FileInfo, type FilterName, package_, scanProject, Sorting,
} from './lib.js';
import {boxError, type BoxOptions, formatConfigConflicts} from './styling.js';

export function logError(message: string, options?: BoxOptions) {
	console.log(boxError(message, {noColor: getColorLevel(program.opts()) === 0, ...options}));
}

/**
 * Use it instead of {@link program}.parse()
 */
export async function programInit() {
	Config.configManager.load();
	program.parseOptions(process.argv);
	const flags = program.opts<ProgramFlags>();
	const chalk = getChalk(getColorLevel(flags));
	try {
		Config.configManager.load();
	} catch (error) {
		formatConfigConflicts(chalk, flags.decor, error);
		return;
	}

	try {
		await builtIns;
		const configPlugins = Config.configManager.get('plugins');
		const loaded = await loadPluginsQueue(flags.plugins);
		for (const load of loaded) {
			if (!load.isLoaded) {
				logError(format(load.exports), {
					title: `Unable to load plugin '${load.moduleName}' ` + (configPlugins.includes(load.moduleName)
						? '(imported by ' + Config.configManager.filePath + ')'
						: '(imported by --plugins option)'),
				});
			}
		}
	} catch (error) {
		logError(format(error));
		process.exit(1); // eslint-disable-line unicorn/no-process-exit
	}

	program.version('v' + package_.version, '-v');
	program.addOption(new Option('--no-color', 'force disable colors').default(false));
	Config.configValueLinkCliOption('plugins', program, new Option('--plugins <modules...>', 'import modules to modify behavior'), parseArgumentArrayString);
	Config.configValueLinkCliOption('color', program, new Option('--color <level>', 'the interface color level'), parseArgumentInt);
	Config.configValueLinkCliOption('decor', program, new Option('--decor <decor>', 'the interface decorations'));
	Config.configValueLinkCliOption('parsable', scanProgram, new Option('-p, --parsable [parsable]', 'print parsable text'), parseArgumentBool);
	Config.configValueLinkCliOption('target', scanProgram, new Option('-t, --target <ignorer>', 'the scan target'));
	Config.configValueLinkCliOption('filter', scanProgram, new Option('--filter <filter>', 'filter results'));
	Config.configValueLinkCliOption('sort', scanProgram, new Option('--sort <sorter>', 'sort results'));
	Config.configValueLinkCliOption('style', scanProgram, new Option('--style <style>', 'results view mode'));
	Config.configValueLinkCliOption('depth', scanProgram, new Option('--depth <depth>', 'the max results depth'), parseArgumentInt);
	Config.configValueLinkCliOption('showSources', scanProgram, new Option('--show-sources [show]', 'show scan sources'), parseArgumentBool);

	program.parse();
}

/** Chalk, but configured by view-ignored cli. */
export function getColorLevel(flags: ProgramFlags): ColorSupportLevel {
	const colorLevel = (flags.noColor ? 0 : Math.max(0, Math.min(Number(flags.color ?? 3), 3))) as ColorSupportLevel;
	return colorLevel;
}

/** Chalk, but configured by view-ignored cli. */
export function getChalk(colorLevel: ColorSupportLevel): ChalkInstance {
	const chalk = new Chalk({level: colorLevel});
	return chalk;
}

/**
 * Command-line entire program flags.
 */
export type ProgramFlags = {
	plugins: string[];
	noColor: boolean;
	color: string;
	decor: DecorName;
};

/**
 * Command-line 'scan' command flags.
 */
export type ScanFlags = {
	target: string;
	filter: FilterName;
	sort: SortName;
	style: StyleName;
	showSources: boolean;
	depth: number;
	parsable: boolean;
};

/**
 * Command-line 'cfg get' command flags.
 */
export type ConfigGetFlags = {
	real: boolean;
};

/**
 * `view-ignored` command-line programl
 */
export const program = new Command();

/**
 * Command-line 'scan' command.
 */
export const scanProgram = program
	.command('scan')
	.aliases(['sc'])
	.description('get ignored/included paths')
	.action(actionScan);

/**
* Command-line 'config' command.
*/
export const cfgProgram = program
	.command('config')
	.alias('cfg')
	.description('cli config manipulation');

/**
 * Command-line argument: key=value pair.
 * @see {@link parseArgumentKeyValue}
 */
export const argumentConfigKeyValue = new Argument('[pair]', 'the configuration entry key=value\'').argParser(parseArgumentKeyValue);
/**
 * Command-line argument: config property.
 * @see {@link Config.configKeyList}
 */
export const argumentConfigKey = new Argument('[key]', 'the configuration setting name').choices(Config.configKeyList);

export const cfgGetOption = new Option('--real', 'use default value(s) as fallback').default(false);

cfgProgram
	.command('path').description('print the config file path')
	.action(actionCfgPath);
cfgProgram
	.command('set').description('set config property using syntax \'key=value\'')
	.addArgument(argumentConfigKeyValue)
	.action(actionCfgSet);
cfgProgram
	.command('unset').description('delete configuration value if cpecified, otherwise delete entire config')
	.addArgument(argumentConfigKey)
	.action(actionCfgUnset);
cfgProgram
	.command('get').description('print configuration value(s). You can use --real option to view real values')
	.addOption(cfgGetOption)
	.addArgument(argumentConfigKey)
	.action(actionCfgGet);

export function parseArgumentArrayString(argument: string): string[] {
	return argument.split(/[ ,|]/).filter(Boolean);
}

export function parseArgumentBool(argument: string): boolean {
	if (!Config.boolValues.includes(argument)) {
		throw new InvalidArgumentError(`Got invalid value '${argument}'. Should be a boolean.`);
	}

	return Config.trueValues.includes(argument);
}

export function parseArgumentInt(argument: string): number {
	const number_ = Number.parseInt(argument, 10);
	if (!Number.isInteger(number_)) {
		throw new InvalidArgumentError(`Got invalid value '${number_}'. Should be an integer.`);
	}

	return number_;
}

export function parseArgumentKey(key: string): Config.ConfigKey {
	if (!Config.isConfigKey(key)) {
		throw new InvalidArgumentError(`Got invalid key '${key}'. Allowed config keys are ${Config.configKeyList.join(', ')}.`);
	}

	return key;
}

export function parseArgumentKeyValue(pair: string): Config.ConfigPair {
	const result = pair.split('=') as [string, string];
	const [key, valueString] = result;
	if (result.length !== 2) {
		throw new InvalidArgumentError('Expected \'key=value\'.');
	}

	if (!Config.isConfigKey(key)) {
		throw new InvalidArgumentError(`Got invalid key '${key}'. Allowed config keys are ${Config.configKeyList.join(', ')}.`);
	}

	const {parseArg: parseArgument} = Config.configValueGetCliOption(key)!;
	const value = parseArgument?.<unknown>(valueString, undefined) ?? valueString;

	if (!Config.isConfigValue(key, value)) {
		const list = Config.configValueList(key);
		if (list === undefined) {
			throw new InvalidArgumentError(`Invalid value '${valueString}' for the key '${key}'.`);
		}

		if (typeof list !== 'string') {
			throw new InvalidArgumentError(`Invalid value '${valueString}' for the key '${key}'. Allowed config values are ${list.join(', ')}`);
		}

		throw new InvalidArgumentError(`Invalid value '${valueString}' for the key '${key}'. ${list}`);
	}

	return [key, value] as [Config.ConfigKey, Config.ConfigValue];
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(): Promise<void> {
	const flagsGlobal: ProgramFlags & ScanFlags = scanProgram.optsWithGlobals();
	const cwd = process.cwd();
	const start = Date.now();
	const colorLevel = getColorLevel(program.opts());
	const chalk = getChalk(colorLevel);
	const spinner = ora({text: cwd, color: 'white'});

	let fileInfoList: FileInfo[];
	try {
		fileInfoList = await scanProject(flagsGlobal.target, {filter: flagsGlobal.filter, maxDepth: flagsGlobal.depth});
	} catch (error) {
		spinner.stop();
		spinner.clear();
		if (!(error instanceof ErrorNoSources)) {
			throw error;
		}

		console.error(`Bad sources for ${flagsGlobal.target}: ${ErrorNoSources.walk(flagsGlobal.target)}`);
		process.exit(1); // eslint-disable-line unicorn/no-process-exit
	}

	if (flagsGlobal.parsable) {
		console.log(fileInfoList.map(fi => fi.filePath + (flagsGlobal.showSources ? '<' + fi.source.sourcePath : '')).join('|'));
		return;
	}

	spinner.start();

	spinner.suffixText = 'Generating...';

	const sorter = Sorting[flagsGlobal.sort];
	const cache = new Map<string, number>();
	if (flagsGlobal.sort === 'modified') {
		for (const filePath of fileInfoList.map(String)) {
			fs.stat(filePath, (error, fileStat) => {
				if (error) {
					throw error;
				}

				cache.set(filePath, fileStat.mtime.getTime());
			});
		}
	}

	const lookedSorted = fileInfoList.sort((a, b) => sorter(a.toString(), b.toString(), cache));

	const files = formatFiles(lookedSorted, {
		chalk, style: flagsGlobal.style, decor: flagsGlobal.decor, showSources: flagsGlobal.showSources,
	});
	const checkSymbol = decorCondition(flagsGlobal.decor, {ifEmoji: '✅', ifNerd: '\uF00C', postfix: ' '});
	const fastSymbol = decorCondition(flagsGlobal.decor, {ifEmoji: '⚡', ifNerd: '\uDB85\uDC0C'});
	const bind = targetGet(flagsGlobal.target)!;
	const name = typeof bind.name === 'string' ? bind.name : decorCondition(flagsGlobal.decor, bind.name);
	const infoSymbol = decorCondition(flagsGlobal.decor, {ifEmoji: 'ℹ️', ifNerd: '\uE66A', postfix: ' '});

	const time = Date.now() - start;
	let message = '';
	message += files;
	message += '\n';
	message += `${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.`;
	message += '\n';
	message += `${fileInfoList.length} files listed for ${name} (${flagsGlobal.filter}).`;
	message += '\n';
	if (bind.testCommand) {
		message += '\n';
		message += `${chalk.blue(infoSymbol)}You can use '${chalk.magenta(bind.testCommand)}' to check if the list is valid.`;
	}

	message += '\n';
	spinner.stop();
	spinner.clear();
	console.log(cwd + '\n' + message);
}

/**
 * Command-line 'config path' command action.
 */
export function actionCfgPath(): void {
	console.log(Config.configFilePath);
}

/**
 * Command-line 'config set' command action
 */
export function actionCfgSet(pair?: Config.ConfigPair): void {
	if (pair === undefined) {
		console.log(`Allowed config keys are ${Config.configKeyList.join(', ')}.`);
		return;
	}

	const [key, value] = pair;
	Config.configManager.set(key, value).save();
	console.log(Config.configManager.getPairString(key));
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgUnset(key: Config.ConfigKey | undefined): void {
	if (key === undefined) {
		console.log('Configuration file has been completely deleted.');
	}

	Config.configManager.unset(key).save();
	console.log(Config.configManager.getPairString(key));
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgGet(key: Config.ConfigKey | undefined, options: ConfigGetFlags): void {
	console.log(Config.configManager.getPairString(key, options.real));
}
