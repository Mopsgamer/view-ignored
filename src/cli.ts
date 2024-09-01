/* eslint-disable unicorn/no-process-exit */
import fs from 'node:fs';
import {format} from 'node:util';
import * as process from 'node:process';
import {Chalk, type ChalkInstance, type ColorSupportLevel} from 'chalk';
import {
	Argument, InvalidArgumentError, Option, Command,
} from 'commander';
import ora from 'ora';
import * as Config from './config.js';
import {
	builtIns, loadPluginsQueue, targetGet, targetList,
} from './browser/binds/index.js';
import {
	decorCondition, type DecorName, formatFiles, type StyleName,
} from './browser/styling.js';
import {makeMtimeCache, sortNameList, type SortName} from './browser/sorting.js';
import {
	type FileInfo, type FilterName, filterNameList, package_, readDirectoryDeep, realOptions, scanPathList, Sorting,
} from './lib.js';
import {
	boxError, decorNameList, styleNameList, type BoxOptions,
} from './styling.js';

export function logError(message: string, options?: BoxOptions) {
	console.log(boxError(message, {noColor: getColorLevel(program.opts()) === 0, ...options}));
}

/**
 * Use it instead of {@link program.parse}.
 */
export async function programInit() {
	try {
		const {configManager, configDefault, configValueArray, configValueBoolean, configValueInteger, configValueString, configValueLiteral} = Config;

		program.parseOptions(process.argv);
		const flags = program.optsWithGlobals<ProgramFlags>();

		configManager.key<'plugins'>('plugins', configDefault.plugins, configValueArray(configValueString));
		configManager.load();
		try {
			await builtIns;
			const configPlugins = configManager.get('plugins');
			const loaded = await loadPluginsQueue(flags.plugins);
			for (const load of loaded) {
				if (!load.isLoaded) {
					logError(format(load.exports), {
						title: `Unable to load plugin '${load.moduleName}' ` + (configPlugins.includes(load.moduleName)
							? '(imported by ' + configManager.path + ')'
							: '(imported by --plugins option)'),
					});
				}
			}
		} catch (error) {
			logError(format(error));
			process.exit(1);
		}

		configManager.key<'parsable'>('parsable', configDefault.parsable, configValueBoolean);
		configManager.key<'color'>('color', configDefault.color, configValueLiteral(Config.colorTypeList));
		configManager.key<'target'>('target', configDefault.target, configValueLiteral(targetList()));
		configManager.key<'filter'>('filter', configDefault.filter, configValueLiteral(filterNameList));
		configManager.key<'sort'>('sort', configDefault.sort, configValueLiteral(sortNameList));
		configManager.key<'style'>('style', configDefault.style, configValueLiteral(styleNameList));
		configManager.key<'decor'>('decor', configDefault.decor, configValueLiteral(decorNameList));
		configManager.key<'depth'>('depth', configDefault.depth, configValueInteger);
		configManager.key<'showSources'>('showSources', configDefault.showSources, configValueBoolean);

		try {
			const errorMessageList = configManager.load();
			if (errorMessageList.length > 0) {
				logError(errorMessageList.join('\n'));
				return;
			}
		} catch (error) {
			logError(format(error));
			return;
		}

		program.version('v' + package_.version, '-v');
		program.addOption(new Option('--no-color', 'force disable colors').default(false));
		program.addOption(new Option('--posix', 'use unix path separator').default(false));
		configManager.setOption('plugins', program, new Option('--plugins <modules...>', 'import modules to modify behavior'), parseArgumentArrayString);
		configManager.setOption('color', program, new Option('--color <level>', 'the interface color level'), parseArgumentInt);
		configManager.setOption('decor', program, new Option('--decor <decor>', 'the interface decorations'));
		configManager.setOption('parsable', scanProgram, new Option('-p, --parsable [parsable]', 'print parsable text'), parseArgumentBool);
		configManager.setOption('target', scanProgram, new Option('-t, --target <ignorer>', 'the scan target'));
		configManager.setOption('filter', scanProgram, new Option('--filter <filter>', 'filter results'));
		configManager.setOption('sort', scanProgram, new Option('--sort <sorter>', 'sort results'));
		configManager.setOption('style', scanProgram, new Option('--style <style>', 'results view mode'));
		configManager.setOption('depth', scanProgram, new Option('--depth <depth>', 'the max results depth'), parseArgumentInt);
		configManager.setOption('showSources', scanProgram, new Option('--show-sources [show]', 'show scan sources'), parseArgumentBool);

		program.parse();
	} catch (error) {
		logError(format(error));
		process.exit(1);
	}
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
	posix: boolean;
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
	const errorMessage = Config.configValueHumanBoolean(argument);
	if (errorMessage !== undefined) {
		throw new InvalidArgumentError(errorMessage);
	}

	return Config.trueValues.includes(argument);
}

export function parseArgumentInt(argument: string): number {
	const value = Number.parseInt(argument, 10);
	const errorMessage = Config.configValueInteger(value);
	if (errorMessage !== undefined) {
		throw new InvalidArgumentError(errorMessage);
	}

	return value;
}

export function parseArgumentKey(key: string): string {
	const errorMessage = Config.configManager.checkKey(key);
	if (errorMessage !== undefined) {
		throw new InvalidArgumentError(errorMessage);
	}

	return key;
}

export function parseArgumentKeyValue(pair: string): Config.ConfigPair {
	const result = pair.split('=') as [string, string];
	const [key, valueString] = result;
	if (result.length !== 2) {
		throw new InvalidArgumentError('Expected \'key=value\'.');
	}

	const {parseArg: parseArgument} = Config.configManager.getOption(key) ?? {};
	const value = parseArgument?.<unknown>(valueString, undefined) ?? valueString;

	const errorMessage = Config.configManager.checkValue(key, value);
	if (errorMessage !== undefined) {
		throw new InvalidArgumentError(errorMessage);
	}

	return [key, value] as [Config.ConfigKey, Config.ConfigValue];
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(): Promise<void> {
	const flagsGlobal = scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>();
	const cwd = process.cwd();
	const start = Date.now();
	const colorLevel = getColorLevel(program.opts());
	const chalk = getChalk(colorLevel);
	const spinner = ora({text: cwd, color: 'white'});
	if (!flagsGlobal.parsable) {
		spinner.start();
	}

	const allFilePaths = await readDirectoryDeep(realOptions({posix: flagsGlobal.posix}));

	let fileInfoList: FileInfo[];
	try {
		fileInfoList = await scanPathList(allFilePaths, flagsGlobal.target, {filter: flagsGlobal.filter, maxDepth: flagsGlobal.depth, posix: flagsGlobal.posix});
	} catch (error) {
		spinner.stop();
		spinner.clear();
		logError(format(error));
		process.exit(1);
	}

	if (flagsGlobal.parsable) {
		console.log(fileInfoList.map(fileInfo =>
			fileInfo.path + (
				flagsGlobal.showSources ? '<' + fileInfo.source.path : ''
			),
		).join(','));
		return;
	}

	const sorter = Sorting[flagsGlobal.sort];
	let cache: Map<string, number> | undefined;
	if (flagsGlobal.sort === 'modified') {
		cache = await makeMtimeCache(fileInfoList.map(String));
	}

	const time = Date.now() - start;
	const lookedSorted = fileInfoList.sort((a, b) => sorter(a.toString(), b.toString(), cache!));

	const files = formatFiles(lookedSorted, {
		chalk,
		posix: flagsGlobal.posix,
		style: flagsGlobal.style,
		decor: flagsGlobal.decor,
		showSources: flagsGlobal.showSources,
	});
	const checkSymbol = decorCondition(flagsGlobal.decor, {ifEmoji: '✅', ifNerd: '\uF00C', postfix: ' '});
	const fastSymbol = decorCondition(flagsGlobal.decor, {ifEmoji: '⚡', ifNerd: '\uDB85\uDC0C'});
	const bind = targetGet(flagsGlobal.target)!;
	const name = typeof bind.name === 'string' ? bind.name : decorCondition(flagsGlobal.decor, bind.name);
	const infoSymbol = decorCondition(flagsGlobal.decor, {ifEmoji: 'ℹ️', ifNerd: '\uE66A', postfix: ' '});

	let message = '';
	message += files;
	message += '\n';
	message += `${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.`;
	message += '\n';
	message += `${fileInfoList.length} files listed for ${name} (${flagsGlobal.filter}).`;
	message += '\n';
	message += `Processed ${allFilePaths.length} files.`;
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
	const errorMessage = Config.configManager.set(key, value);
	if (errorMessage !== undefined) {
		logError(errorMessage);
		return;
	}

	Config.configManager.save();
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
