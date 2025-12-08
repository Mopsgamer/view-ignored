import { format } from 'node:util'
import * as process from 'node:process'
import { icons } from '@m234/nerd-fonts'
import { Chalk } from 'chalk'
import { Argument, Command, InvalidArgumentError, Option } from 'commander'
import * as Config from './config.js'
import {
  loadBuiltIns,
  loadPlugins,
  targetGet,
  targetList,
} from './browser/binds/index.js'
import {
  decorCondition,
  type DecorName,
  formatFiles,
  type StyleName,
} from './browser/styling.js'
import { type SortName, sortNameList } from './browser/sorting.js'
import {
  decorNameList,
  highlight,
  stringTime,
  styleNameList,
} from './styling.js'
import {
  type DeepStreamDataRoot,
  Directory,
  type File,
  type FileInfo,
  makeOptionsReal,
  package_,
  scan,
  Sorting,
  ViewIgnoredError,
} from './lib.js'
import { type FilterName, filterNameList } from './browser/filtering.js'
import ora from 'ora'

export function logError(message: string, title: string) {
  console.log('ERROR: ' + title + '\n', message)
}

/**
 * Use it instead of {@link program.parse}.
 * @internal
 */
export async function programInit() {
  try {
    const {
      configManager,
      configDefault,
      configValueArray,
      configValueString,
      configValueLiteral,
    } = Config

    const flags = program.optsWithGlobals<ProgramFlags>()
    const chalk = new Chalk()

    configManager.keySetValidator<'plugins'>(
      'plugins',
      configDefault.plugins,
      configValueArray(configValueString()),
    )
    const loadResultConfig = configManager.load()
    const builtInPlugins = await loadBuiltIns()
    const configPlugins = configManager.get<'plugins'>('plugins')
    const loadResultPlugins = [
      ...(flags.plugins ? await loadPlugins(flags.plugins) : []),
      ...builtInPlugins,
    ]
    for (const loadResult of loadResultPlugins) {
      if (loadResult.isLoaded) {
        continue
      }

      logError(format(loadResult.exports), `view-ignored - Plugin loading failed: '${loadResult.resource}' ${
        builtInPlugins.includes(loadResult)
          ? '(imported from built-ins)'
          : (configPlugins.includes(loadResult.resource)
            ? '(imported by ' + configManager.path + ')'
            : '(imported by --plugins option)')
      }.`)
    }

    const targets = targetList()
    configManager.keySetValidator(
      'target',
      configDefault.target,
      configValueLiteral(targets),
    )

    {
      const title = 'view-ignored - Configuration loading failed.'
      const infoSymbol = decorCondition(flags.decor, {
        ifEmoji: 'ℹ️',
        ifNerd: icons['nf-seti-info'].value,
        postfix: ' ',
      })
      const errorIcon = decorCondition(flags.decor, {
        ifNerd: icons['nf-seti-error'].value,
        ifEmoji: '⚠️',
        postfix: ' ',
      })
      const footer = `\n\n${
        chalk.blue(infoSymbol)
      }Configuration path: ${Config.configManager.path}`
      if (typeof loadResultConfig === 'string') {
        logError(loadResultConfig + footer, title)
        process.exit(1)
      }

      if (loadResultConfig && loadResultConfig?.size > 0) {
        const propertiesErrors = [...loadResultConfig.entries()].map(
          ([key, message]) => {
            const pair = Config.configManager.getPairString(key, {
              chalk,
              types: false,
              real: true,
            })
            return `${pair} - ${chalk.red(errorIcon)}${message}`
          },
        ).join('\n')

        logError(`Invalid properties:\n${propertiesErrors}${footer}`, title)
        process.exit(1)
      }
    }

    program.version('v' + package_.version, '-v')
    configManager.setOption(
      'noColor',
      program,
      new Option('--no-color', 'force disable colors'),
    )
    configManager.setOption(
      'posix',
      program,
      new Option('--posix', 'use unix path separator'),
    )
    configManager.setOption(
      'plugins',
      program,
      new Option('--plugins <modules...>', 'import modules to modify behavior'),
      parseArgumentArrayString,
    )
    configManager.setOption(
      'decor',
      program,
      new Option('--decor <decor>', 'the interface decorations'),
      createArgumentParserStringLiteral([...decorNameList]),
    )
    configManager.setOption(
      'parsable',
      program,
      new Option('-p, --parsable', 'print parsable text'),
    )
    configManager.setOption(
      'target',
      scanProgram,
      new Option('-t, --target <ignorer>', 'the scan target'),
      createArgumentParserStringLiteral(targets),
    )
    configManager.setOption(
      'filter',
      scanProgram,
      new Option('--filter <filter>', 'filter results'),
      createArgumentParserStringLiteral([...filterNameList]),
    )
    configManager.setOption(
      'sort',
      scanProgram,
      new Option('--sort <sorter>', 'sort results'),
      createArgumentParserStringLiteral([...sortNameList]),
    )
    configManager.setOption(
      'style',
      scanProgram,
      new Option('--style <style>', 'results view mode'),
      createArgumentParserStringLiteral([...styleNameList]),
    )
    configManager.setOption(
      'depth',
      scanProgram,
      new Option('--depth <depth>', 'the max results depth'),
      parseArgumentInteger,
    )
    configManager.setOption(
      'showSources',
      scanProgram,
      new Option('--show-sources', 'show scan sources'),
    )
    configManager.setOption(
      'concurrency',
      scanProgram,
      new Option(
        '--concurrency [limit]',
        'the limit for the signgle directory operations',
      ),
      parseArgumentInteger,
    )

    program.parse()
  }
  catch (error) {
    logError(format(error), 'view-ignored - Fatal error.')
    process.exit(1)
  }
}

/**
 * Command-line entire program flags.
 */
export type ProgramFlags = {
  posix: boolean
  plugins: string[]
  noColor: boolean
  decor: DecorName
  parsable: boolean
}

/**
 * Command-line 'scan' command flags.
 */
export type ScanFlags = {
  target: string
  filter: FilterName
  sort: SortName
  style: StyleName
  showSources: boolean
  depth: number
  concurrency: number
}

/**
 * Command-line 'cfg get' command flags.
 */
export type ConfigGetFlags = {
  real: boolean
  types: boolean
}

/**
 * `view-ignored` command-line programl
 */
export const program = new Command()

/**
 * Command-line 'scan' command.
 */
export const scanProgram = program
  .command('scan')
  .aliases(['sc'])
  .description('get ignored/included paths')
  .action(actionScan)

/**
 * Command-line 'config' command.
 */
export const cfgProgram = program
  .command('config')
  .alias('cfg')
  .description('cli config manipulation')

/**
 * Command-line argument: key=value pair.
 * @see {@link parseArgumentKeyValue}
 */

export const argumentConfigKeyValue = new Argument(
  '[pair]',
  'the configuration entry key=value\'',
).argParser(parseArgumentKeyValue)

/**
 * Command-line argument: config property.
 * @see {@link Config.configKeyList}
 */
export const argumentConfigKey = new Argument(
  '[key]',
  'the configuration setting name',
).choices(Config.configKeyList)

export const cfgRealOption = new Option(
  '--real',
  'use default value(s) as fallback',
).default(false)

export const cfgTypesOption = new Option(
  '--types',
  'use default value(s) as fallback',
).default(false)

cfgProgram
  .command('path').description('print the config file path')
  .action(actionCfgPath)
cfgProgram
  .command('set').description('set config property using syntax \'key=value\'')
  .addArgument(argumentConfigKeyValue)
  .addOption(cfgRealOption)
  .addOption(cfgTypesOption)
  .action(actionCfgSet)
cfgProgram
  .command('unset').description(
    'delete configuration value if cpecified, otherwise delete entire config',
  )
  .addArgument(argumentConfigKey)
  .addOption(cfgRealOption)
  .addOption(cfgTypesOption)
  .action(actionCfgUnset)
cfgProgram
  .command('get').description(
    'print configuration value(s). You can use --real option to view real values',
  )
  .addOption(cfgRealOption)
  .addOption(cfgTypesOption)
  .addArgument(argumentConfigKey)
  .action(actionCfgGet)

export function parseArgumentArrayString(argument: string): string[] {
  return argument.split(/[ ,|]/).filter(Boolean)
}

export function parseArgumentInteger(argument: string): number {
  const value = Number.parseInt(argument, 10)
  const errorMessage = Config.configValueInteger()(value)
  if (errorMessage !== undefined) {
    throw new InvalidArgumentError(errorMessage)
  }

  return value
}

export function createArgumentParserStringLiteral(choices: string[]) {
  return function (argument: string): string {
    const errorMessage = Config.configValueLiteral(choices)(argument)
    if (errorMessage !== undefined) {
      throw new InvalidArgumentError(errorMessage)
    }

    return argument
  }
}

export function parseArgumentKey(key: string): string {
  const errorMessage = Config.configManager.checkKey(key)
  if (errorMessage !== undefined) {
    throw new InvalidArgumentError(errorMessage)
  }

  return key
}

export function parseArgumentKeyValue(pair: string): Config.ConfigPair {
  const result = pair.split('=') as [string] | [string, string]
  if (result.length > 2) {
    throw new InvalidArgumentError('Expected \'key=value\'.')
  }

  if (result.length !== 2) {
    const [key] = result
    const message = Config.configManager.checkKey(key)
    if (message !== undefined) {
      throw new InvalidArgumentError(`Expected 'key=value'. ${message}`)
    }
  }

  const [key, valueString] = result as [string, string]
  const { parseArg: parseArgument } = Config.configManager.getOption(key) ?? {}
  const value = parseArgument<unknown>?.(valueString, undefined) ?? valueString

  const message = Config.configManager.checkValue(key, value)
  if (message !== undefined) {
    throw new InvalidArgumentError(`Expected 'key=value'. ${message}`)
  }

  return [key, value] as [Config.ConfigKey, Config.ConfigValue]
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(): Promise<void> {
  const flags = scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>()
  const start = Date.now()
  const chalk = new Chalk()

  const bind = targetGet(flags.target)
  if (bind === undefined) {
    logError(
      format(
        `Bad target '${flags.target}'. Registered targets: ${
          targetList().join(', ')
        }.`,
      ),
      'view-ignored - Fatal error.',
    )
    process.exit(1)
  }

  const optionsReal = makeOptionsReal({
    posix: flags.posix || flags.parsable,
    concurrency: flags.concurrency,
  })
  const stream = Directory.deepStream('.', {
    concurrency: optionsReal.concurrency,
    cwd: optionsReal.cwd,
    modules: optionsReal.modules,
  })
  try {
    if (flags.parsable) {
      await stream.run()
      const fileInfoList: FileInfo[] = await scan(stream, {
        ...optionsReal,
        target: flags.target,
        filter: flags.filter,
        maxDepth: flags.depth,
      })
      console.log(
        fileInfoList.map(fileInfo =>
          fileInfo.relativePath + (
            flags.showSources && fileInfo.source !== undefined
              ? '<' + (fileInfo.source.relativePath)
              : ''
          ),
        ).join(','),
      )
    }
    else {
      let name: string
        = decorCondition(flags.decor, { ifNerd: bind.icon?.value, postfix: ' ' })
          + bind.name
      if (bind.icon?.color !== undefined) {
        name = chalk.hex('#' + bind.icon.color)(name)
      }

      const progress = { current: 0, directories: 0, files: 0, total: 0 }
      const reading = new Promise<DeepStreamDataRoot>((resolve) => {
        stream.on('end', (data) => {
          resolve(data)
        })
      })

      console.log(`${name} ${chalk.hex('#73A7DE')(flags.filter)}`)
      const spinner = ora('Scanning')
      stream.on('progress', (prog) => {
        spinner.text = `Scanning ${prog.current}/${prog.total}`
        Object.assign(progress, prog)
      })
      await stream.run()
      const fileInfoList = await scan(
        await stream.endPromise,
        {
          ...optionsReal,
          target: flags.target,
          filter: flags.filter,
          maxDepth: flags.depth,
        },
      )
      const sorter = Sorting[flags.sort]
      const cache = new Map<File, number>()
      if (flags.sort === 'modified') {
        const { tree } = await reading
        await tree.deepModifiedTime(cache, optionsReal)
      }

      const time = Date.now() - start
      const fileInfoListSorted = fileInfoList.sort((a, b) =>
        sorter(String(a), String(b), cache),
      )

      const files = formatFiles(
        fileInfoListSorted,
        {
          chalk,
          posix: flags.posix,
          style: flags.style,
          decor: flags.decor,
          showSources: flags.showSources,
        },
      )
      const fastSymbol = decorCondition(flags.decor, {
        ifEmoji: '⚡',
        ifNerd: icons['nf-md-lightning_bolt'].value,
      })
      const infoSymbol = decorCondition(flags.decor, {
        ifEmoji: 'ℹ️',
        ifNerd: icons['nf-seti-info'].value,
        postfix: ' ',
      })

      let message = ''
      message += files
      message += '\n'
      message += `Done in ${
        time < 2000 ? chalk.yellow(fastSymbol) : ''
      }${stringTime(time, chalk)}.`
      message += '\n'
      message += `Listed ${
        highlight(String(fileInfoList.length), chalk)
      } files.`
      message += '\n'
      message += `Processed ${
        highlight(String(progress.files), chalk)
      } files and ${
        highlight(String(progress.directories), chalk)
      } directories.`
      message += '\n'
      if (bind.testCommand) {
        message += '\n'
        message += `${chalk.blue(infoSymbol)}You can use ${
          highlight(`'${bind.testCommand}'`, chalk)
        } to check if the list is valid.`
        message += '\n'
      }

      console.log(message)
    }
  }
  catch (error) {
    logError(
      format(error instanceof ViewIgnoredError ? error.message : error),
      'view-ignored - Error while scan.',
    )
  }
}

/**
 * Command-line 'config path' command action.
 */
export function actionCfgPath(): void {
  console.log(Config.configManager.path)
}

/**
 * Command-line 'config set' command action
 */
export function actionCfgSet(
  pair: Config.ConfigPair | undefined,
  options: ConfigGetFlags,
): void {
  if (pair === undefined) {
    console.log(`Allowed config keys are ${Config.configKeyList.join(', ')}.`)
    return
  }

  const [key, value] = pair
  const errorMessage = Config.configManager.set(key, value)
  if (errorMessage !== undefined) {
    console.log(errorMessage)
    return
  }

  const flags = scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>()
  const chalk = new Chalk()
  Config.configManager.save()
  console.log(Config.configManager.getPairString(key, {
    chalk,
    real: options.real,
    types: options.types,
    parsable: flags.parsable,
  }))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgUnset(
  key: Config.ConfigKey | undefined,
  options: ConfigGetFlags,
): void {
  if (key === undefined) {
    console.log('Configuration file has been completely deleted.')
  }

  const flags = scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>()
  const chalk = new Chalk()
  Config.configManager.unset(key).save()
  console.log(Config.configManager.getPairString(key, {
    chalk,
    real: options.real,
    types: options.types,
    parsable: flags.parsable,
  }))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgGet(
  key: Config.ConfigKey | undefined,
  options: ConfigGetFlags,
): void {
  const flags = scanProgram.optsWithGlobals<ProgramFlags & ScanFlags>()
  const chalk = new Chalk()
  console.log(Config.configManager.getPairString(key, {
    chalk,
    real: options.real,
    types: options.types,
    parsable: flags.parsable,
  }))
}
