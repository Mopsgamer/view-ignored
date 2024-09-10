/* eslint-disable unicorn/no-process-exit */
import {format} from 'node:util';
import * as process from 'node:process';
import {Chalk, type ChalkInstance, type ColorSupportLevel} from 'chalk';
import {
	Argument, InvalidArgumentError, Option, Command,
} from 'commander';
import {ProgressBar} from '@opentf/cli-pbar';
import * as Config from './config.js';
import {
	targetGet, loadPlugins, loadBuiltIns,
	targetList,
} from './browser/binds/index.js';
import {
	decorCondition, type DecorName, formatFiles, type StyleName,
} from './browser/styling.js';
import {makeMtimeCache, type SortName} from './browser/sorting.js';
import {
	ErrorNoSources,
	type File,
	type FileInfo, type FilterName, package_, readDirectoryDeep, realOptions, scanPathList, Sorting,
	streamDirectoryDeep,
} from './lib.js';
import {
	boxError, type BoxOptions,
} from './styling.js';

export function logError(message: string, options?: BoxOptions) {
	console.log(boxError(message, {noColor: getColorLevel(program.opts()) === 0, ...options}));
}

/**
 * Use it instead of {@link program.parse}.
 */
export async function programInit() {
	try {
		const {configManager, configDefault, configValueArray, configValueString, configValueLiteral} = Config;

		const flags = program.optsWithGlobals<ProgramFlags>();
		const chalk = getChalk(getColorLevel(flags));

		configManager.keySetValidator<'plugins'>('plugins', configDefault.plugins, configValueArray(configValueString()));
		const loadResultConfig = configManager.load();
		const builtInPlugins = await loadBuiltIns();
		const configPlugins = configManager.get<'plugins'>('plugins');
		const loadResultPlugins = (flags.plugins ? await loadPlugins(flags.plugins) : []).concat(builtInPlugins);
		for (const loadResult of loadResultPlugins) {
			if (loadResult.isLoaded) {
				continue;
			}

			logError(format(loadResult.exports), {
				title: `view-ignored - Plugin loading failed: '${loadResult.resource}' ${
					builtInPlugins.includes(loadResult)
						? '(imported from built-ins)'
						: (configPlugins.includes(loadResult.resource)
							? '(imported by ' + configManager.path + ')'
							: '(imported by --plugins option)')
				}.`,
			});
		}

		configManager.keySetValidator('target', configDefault.target, configValueLiteral(targetList()));

		{
			const title = 'view-ignored - Configuration loading failed.';
			const infoSymbol = decorCondition(flags.decor, {ifEmoji: 'ℹ️', ifNerd: '\uE66A', postfix: ' '});
			const errorIcon = decorCondition(flags.decor, {
				ifNerd: '\uE654', ifEmoji: '⚠️', postfix: ' ',
			});
			const footer = `\n\n${chalk.blue(infoSymbol)}Configuration path: ${Config.configManager.path}`;
			if (typeof loadResultConfig === 'string') {
				logError(loadResultConfig + footer, {title});
				process.exit(1);
			}

			if (loadResultConfig && loadResultConfig?.size > 0) {
				const propertiesErrors = Array.from(loadResultConfig.entries()).map(
					([key, message]) => `${Config.configManager.getPairString(key, {chalk, types: false, real: true})} - ${chalk.red(errorIcon)}${message}`,
				).join('\n');
				logError(`Invalid properties:\n${propertiesErrors}${footer}`, {title});

				process.exit(1);
			}
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
		configManager.setOption('concurrency', scanProgram, new Option('--concurrency [limit]', 'the limit for the signgle directory operations'), parseArgumentInt);

		program.parse();
	} catch (error) {
		logError(format(error), {title: 'view-ignored - Fatal error.'});
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
	concurrency: number;
};

/**
 * Command-line 'cfg get' command flags.
 */
export type ConfigGetFlags = {
	real: boolean;
	types: boolean;
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

export const cfgRealOption = new Option('--real', 'use default value(s) as fallback').default(false);
export const cfgTypesOption = new Option('--types', 'use default value(s) as fallback').default(false);

cfgProgram
	.command('path').description('print the config file path')
	.action(actionCfgPath);
cfgProgram
	.command('set').description('set config property using syntax \'key=value\'')
	.addArgument(argumentConfigKeyValue)
	.addOption(cfgRealOption)
	.addOption(cfgTypesOption)
	.action(actionCfgSet);
cfgProgram
	.command('unset').description('delete configuration value if cpecified, otherwise delete entire config')
	.addArgument(argumentConfigKey)
	.addOption(cfgRealOption)
	.addOption(cfgTypesOption)
	.action(actionCfgUnset);
cfgProgram
	.command('get').description('print configuration value(s). You can use --real option to view real values')
	.addOption(cfgRealOption)
	.addOption(cfgTypesOption)
	.addArgument(argumentConfigKey)
	.action(actionCfgGet);

export function parseArgumentArrayString(argument: string): string[] {
	return argument.split(/[ ,|]/).filter(Boolean);
}

export function parseArgumentBool(argument: string): boolean {
	const errorMessage = Config.configValueSwitch()(argument);
	if (errorMessage !== undefined) {
		throw new InvalidArgumentError(errorMessage);
	}

	return Config.trueValues.includes(argument);
}

export function parseArgumentInt(argument: string): number {
	const value = Number.parseInt(argument, 10);
	const errorMessage = Config.configValueInteger()(value);
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
	const result = pair.split('=') as [string] | [string, string];
	if (result.length > 2) {
		throw new InvalidArgumentError('Expected \'key=value\'.');
	}

	if (result.length !== 2) {
		const [key] = result;
		const message = Config.configManager.checkKey(key);
		if (message !== undefined) {
			throw new InvalidArgumentError(`Expected 'key=value'. ${message}`);
		}
	}

	const [key, valueString] = result as [string, string];
	const {parseArg: parseArgument} = Config.configManager.getOption(key) ?? {};
	const value = parseArgument?.<unknown>(valueString, undefined) ?? valueString;

	const message = Config.configManager.checkValue(key, value);
	if (message !== undefined) {
		throw new InvalidArgumentError(`Expected 'key=value'. ${message}`);
	}

	return [key, value] as [Config.ConfigKey, Config.ConfigValue];
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(): Promise<void> {
	const flags = scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>();
	const cwd = process.cwd();
	const start = Date.now();
	const colorLevel = getColorLevel(program.opts());
	const chalk = getChalk(colorLevel);

	const options = realOptions({posix: flags.posix || flags.parsable, concurrency: flags.concurrency});
	const stream = streamDirectoryDeep('.', options);
	const bar = new ProgressBar({
		width: 8, color: 'red', bgColor: 'gray', prefix: process.cwd(),
	});
	if (!flags.parsable) {
		bar.start({total: 1});
		let perc = -1;
		stream.on('progress', progress => {
			const {current, total} = progress;
			const newPerc = Math.floor(current / total * 100);
			if (newPerc <= perc) {
				return;
			}

			perc = newPerc;
			bar.update({value: current, total});
		});
	}

	const direntTree = await readDirectoryDeep(stream);
	const direntFlat = direntTree.flat();
	const bind = targetGet(flags.target)!;
	const name = typeof bind.name === 'string' ? bind.name : decorCondition(flags.decor, bind.name);

	let fileInfoList: FileInfo[];
	try {
		fileInfoList = await scanPathList(direntFlat, flags.target, {...options, filter: flags.filter, maxDepth: flags.depth});
		if (!flags.parsable) {
			bar.stop();
		}
	} catch (error) {
		if (!flags.parsable) {
			bar.stop();
		}

		if (error instanceof ErrorNoSources) {
			logError('There was no configuration file in the folders and subfolders that would correctly describe the ignoring.', {title: `view-ignored - No sources for the target ${name}.`});
		} else {
			logError(format(error), {title: 'view-ignored - Scanning unexpected error.'});
		}

		process.exit(1);
	}

	if (flags.parsable) {
		console.log(fileInfoList.map(fileInfo =>
			fileInfo.relativePath + (
				flags.showSources ? '<' + fileInfo.source.relativePath : ''
			),
		).join(','));
		return;
	}

	const sorter = Sorting[flags.sort];
	const cache = new Map<File, number>();
	if (flags.sort === 'modified') {
		await makeMtimeCache(cache, direntTree, {concurrency: flags.concurrency});
	}

	const time = Date.now() - start;
	const lookedSorted = fileInfoList.sort((a, b) => sorter(String(a), String(b), cache));

	const files = formatFiles(lookedSorted, {
		chalk,
		posix: flags.posix,
		style: flags.style,
		decor: flags.decor,
		showSources: flags.showSources,
	});
	const checkSymbol = decorCondition(flags.decor, {ifEmoji: '✅', ifNerd: '\uF00C', postfix: ' '});
	const fastSymbol = decorCondition(flags.decor, {ifEmoji: '⚡', ifNerd: '\uDB85\uDC0C'});
	const infoSymbol = decorCondition(flags.decor, {ifEmoji: 'ℹ️', ifNerd: '\uE66A', postfix: ' '});

	let message = '';
	message += files;
	message += '\n';
	message += `${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.`;
	message += '\n';
	message += `${fileInfoList.length} files listed for ${name} (${flags.filter}).`;
	message += '\n';
	message += `Processed ${direntFlat.length} files.`;
	message += '\n';
	if (bind.testCommand) {
		message += '\n';
		message += `${chalk.blue(infoSymbol)}You can use '${chalk.magenta(bind.testCommand)}' to check if the list is valid.`;
	}

	message += '\n';
	console.log(cwd + '\n' + message);
}

/**
 * Command-line 'config path' command action.
 */
export function actionCfgPath(): void {
	console.log(Config.configManager.path);
}

/**
 * Command-line 'config set' command action
 */
export function actionCfgSet(pair: Config.ConfigPair | undefined, options: ConfigGetFlags): void {
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

	const chalk = getChalk(getColorLevel(scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>()));
	Config.configManager.save();
	console.log(Config.configManager.getPairString(key, {chalk, real: options.real, types: options.types}));
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgUnset(key: Config.ConfigKey | undefined, options: ConfigGetFlags): void {
	if (key === undefined) {
		console.log('Configuration file has been completely deleted.');
	}

	const chalk = getChalk(getColorLevel(scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>()));
	Config.configManager.unset(key).save();
	console.log(Config.configManager.getPairString(key, {chalk, real: options.real, types: options.types}));
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgGet(key: Config.ConfigKey | undefined, options: ConfigGetFlags): void {
	const chalk = getChalk(getColorLevel(scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>()));
	console.log(Config.configManager.getPairString(key, {chalk, real: options.real, types: options.types}));
}
