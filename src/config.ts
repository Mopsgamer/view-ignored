import * as os from 'node:os';
import path from 'node:path';
import {
	existsSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import {format} from 'node:util';
import * as yaml from 'yaml';
import {type ChalkInstance} from 'chalk';
import {type Command, type Option} from 'commander';
import {
	type DecorName, decorNameList, highlight, type StyleName, styleNameList,
} from './styling.js';
import {type ConfigCheckMap} from './errors.js';
import {type SortName, sortNameList} from './browser/sorting.js';
import {filterNameList, type FilterName} from './browser/filtering.js';

/**
 * The full config file name - `".view-ignored"`.
 * @public
 */
export const configFileName = '.view-ignored';

/**
 * The user's home directory + the config file name.
 * @see {@link os.homedir}
 * @private
 */
const configFilePath = path.join(os.homedir(), configFileName);

/**
 * Command-line configuration property list.
 * @public
 */
export const configKeyList = ['posix', 'noColor', 'target', 'filter', 'sort', 'style', 'decor', 'depth', 'showSources', 'plugins', 'parsable', 'concurrency'] as const satisfies ReadonlyArray<keyof Config>;

/**
 * Command-line configuration's property type.
 * @public
 */
export type ConfigKey = typeof configKeyList[number] & keyof Config;

/**
 * @public
 */
export type ConfigValue<KeyT extends ConfigKey = ConfigKey> = Config[KeyT];

/**
 * @public
 */
export type ShowSourcesType = boolean;

/**
 * @public
 */
export function isShowSources(value: unknown): value is ShowSourcesType {
	return typeof value === 'boolean';
}

/**
 * Represents array with the key nad the value.
 * @public
 */
export type ConfigPair<KeyT extends ConfigKey = ConfigKey> = [key: KeyT, value: ConfigValue<KeyT>];

/**
 * Command-line configuration structure.
 * @see {@link configKeyList} Before adding new properties.
 * @public
 */
export type Config = {
	[key: string]: unknown;
	parsable: boolean;
	noColor: boolean;
	posix: boolean;
	plugins: string[];
	target: string;
	filter: FilterName;
	sort: SortName;
	style: StyleName;
	decor: DecorName;
	depth: number;
	showSources: ShowSourcesType;
	concurrency: number;
};

/**
 * Command-line default config values.
 * @public
 */
export const configDefault: Readonly<Config> = {
	parsable: false,
	noColor: false,
	posix: false,
	plugins: [],
	target: 'git',
	filter: 'included',
	sort: 'firstFolders',
	style: 'tree',
	decor: 'normal',
	depth: Infinity,
	showSources: false,
	concurrency: 8,
};

/**
 * @returns Error message and parsed value.
 * @public
 */
export type ConfigValidator = ((value: unknown) => string | undefined) & {
	typeName: string;
};

/**
 * @public
 */
export const configValueArray = <T extends ConfigValidator>(type?: T) => {
	const validator: ConfigValidator = value => {
		if (Array.isArray(value)) {
			if (type === undefined) {
				return;
			}

			const badElementList = value.map(element => type(element)).filter(element => element !== undefined);
			if (badElementList.length > 0) {
				const list = badElementList.map((element, index) => `${index}: ${element}`).join('\n');
				return `The value should be a typed array. Found bad elements:\n${list}`;
			}

			return;
		}

		return 'The value should be an array.';
	};

	validator.typeName = `${type?.typeName ?? 'any'}[]`;

	return validator;
};

/**
 * @public
 */
export const configValueLiteral = (choices: readonly unknown[]): ConfigValidator => {
	const validator: ConfigValidator = value => {
		if (choices.includes(value)) {
			return;
		}

		return `The value is invalid. Choices: ${choices.map(String).join(', ')}.`;
	};

	validator.typeName = choices.map(choice => format('%o', choice)).join('|');

	return validator;
};

/**
 * @public
 */
export const switchTrueValues = ['true', 'on', 'yes', 'y', 'enable', 'enabled', '1'];

/**
 * @public
 */
export const switchFalseValues = ['false', 'off', 'no', 'n', 'disable', 'disabled', '0'];

/**
 * @public
 */
export const booleanValues = switchTrueValues.concat(switchFalseValues);

/**
 * @public
 */
export const configValueSwitch = (): ConfigValidator => {
	const validator: ConfigValidator = value => {
		if (booleanValues.includes(value as string)) {
			return;
		}

		return `The value should be a boolean. Available boolean literals: ${booleanValues.join(', ')}.`;
	};

	validator.typeName = 'switch';

	return validator;
};

/**
 * @public
 */
export const configValueBoolean = (): ConfigValidator => {
	const validator: ConfigValidator = value => {
		if (typeof value === 'boolean') {
			return;
		}

		return 'The value should be a boolean.';
	};

	validator.typeName = 'boolean';
	return validator;
};

/**
 * @public
 */
export const configValueObject = (): ConfigValidator => {
	const validator: ConfigValidator = value => {
		if (value?.constructor === Object) {
			return;
		}

		return 'The value should be an object.';
	};

	validator.typeName = 'object';
	return validator;
};

/**
 * @public
 */
export const configValueString = (): ConfigValidator => {
	const validator: ConfigValidator = value => {
		if (typeof value === 'string') {
			return;
		}

		return 'The value should be a string.';
	};

	validator.typeName = 'string';
	return validator;
};

/**
 * @public
 */
export const configValueNumber = (): ConfigValidator => {
	const validator: ConfigValidator = value => {
		if (typeof value === 'number') {
			return;
		}

		return 'The value should be a number.';
	};

	validator.typeName = 'number';
	return validator;
};

/**
 * @public
 */
export const configValueInteger = (): ConfigValidator => {
	const validator: ConfigValidator = value => {
		if (typeof value === 'number' && (Number.isSafeInteger(value) || Math.abs(value) === Infinity)) {
			return;
		}

		return 'The value should be an integer.';
	};

	validator.typeName = 'integer';
	return validator;
};

/**
 * @public
 */
export type ConfigManagerGetOptions = {
	/**
	 * Use default value as fallback.
	 * @default true
	 */
	real?: boolean;
};

/**
 * @public
 */
export type ConfigManagerGetPairStringOptions = ConfigManagerGetOptions & {
	/**
	 * Add the type postfix.
	 * @default true
	 */
	types?: boolean;

	/**
	 * Determine the colors behavior.
	 * @default undefined
	 */
	chalk?: ChalkInstance;

	/**
	 * Use parsable format. If enabled, `chalk` option ignored.
	 * @default false
	 */
	parsable?: boolean;
};

/**
 * File-specific actions container.
 * @public
 */
export class ConfigManager<ConfigType extends Config = Config> {
	/**
	 * Do not change this value directly.
	 * @see {@link configManager}.
	 */
	private data: Record<string, unknown> = {};
	private readonly configValidation = new Map<keyof ConfigType, ConfigValidator>();
	private readonly cliOptionLinkMap = new Map<string, Option>();
	private readonly dataDefault: Record<string, unknown> = {};

	constructor(
		public readonly path: string,
	) {
		this.keySetValidator('parsable', configDefault.parsable, configValueBoolean());
		this.keySetValidator('noColor', configDefault.noColor, configValueBoolean());
		this.keySetValidator('posix', configDefault.posix, configValueBoolean());
		this.keySetValidator('filter', configDefault.filter, configValueLiteral(filterNameList));
		this.keySetValidator('sort', configDefault.sort, configValueLiteral(sortNameList));
		this.keySetValidator('style', configDefault.style, configValueLiteral(styleNameList));
		this.keySetValidator('decor', configDefault.decor, configValueLiteral(decorNameList));
		this.keySetValidator('depth', configDefault.depth, configValueInteger());
		this.keySetValidator('showSources', configDefault.showSources, configValueBoolean());
		this.keySetValidator('concurrency', configDefault.concurrency, configValueInteger());
	}

	dataCheck(data: unknown): ConfigCheckMap | string {
		const propertyStack: ConfigCheckMap = new Map();
		const object = data as Record<string, unknown>;
		if (object?.constructor !== Object) {
			return configValueObject()(object)!;
		}

		for (const key in object) {
			if (!Object.hasOwn(object, key)) {
				continue;
			}

			const value = object[key];

			const message = this.checkValue<string>(key, value);
			if (message === undefined) {
				continue;
			}

			propertyStack.set(key, message);
		}

		return propertyStack;
	}

	/**
	 * Get type name for the key.
	 */
	getType<T extends keyof ConfigType>(key: T): string;
	getType(key: string): string;
	getType(key: string): string {
		return this.configValidation.get(key)?.typeName ?? 'any';
	}

	/**
	 * Get type checker for the key.
	 */
	keyGetValidator<T extends keyof ConfigType>(key: T): ConfigValidator | undefined;
	keyGetValidator(key: string): ConfigValidator | undefined {
		return this.configValidation.get(key);
	}

	/**
	 * Define type checker for the key.
	 */
	keySetValidator<T extends keyof ConfigType & string>(key: T, defaultValue: ConfigType[T], type: ConfigValidator): this {
		this.configValidation.set(key, type);
		const errorMessage = type(defaultValue);
		if (errorMessage !== undefined) {
			throw new TypeError(`Invalid default value preset for configuration key ${format(key)} - ${errorMessage}`);
		}

		this.dataDefault[key] = defaultValue;
		return this;
	}

	/**
	 * Checks if the key is defined.
	 * @returns Error message if the key is not defined.
	 */
	checkKey(key: string): string | undefined {
		if (this.configValidation.has(key)) {
			return;
		}

		return `Unknown config key '${key}'. Choices: ${Array.from(this.configValidation.keys()).join(', ')}`;
	}

	/**
	 * Call the type checker for the key.
	 */
	checkValue<T extends keyof ConfigType>(key: T, value: unknown): string | undefined;
	checkValue(key: string, value: unknown): string | undefined {
		const validate = this.configValidation.get(key);
		if (validate === undefined) {
			return;
		}

		return validate(value);
	}

	/**
	 * Link a configuration property with a command-line option.
	 */
	setOption<T extends keyof ConfigType>(key: T, command: Command, option: Option, parseArgument?: (argument: string) => unknown): this;
	setOption(key: string, command: Command, option: Option, parseArgument?: (argument: string) => unknown): this {
		if (parseArgument) {
			option.argParser(parseArgument);
		}

		const deflt = configManager.get(key);
		option.default(deflt);
		command.addOption(option);
		this.cliOptionLinkMap.set(key, option);
		return this;
	}

	/**
	 * Get a command-line option for the configuration property.
	 */
	getOption<T extends keyof ConfigType>(key: T): Option | undefined;
	getOption(key: string): Option | undefined;
	getOption(key: string): Option | undefined {
		return this.cliOptionLinkMap.get(key);
	}

	/**
     * Loads the config from the file to {@link configManager.data}.
     * @returns The error message for each invalid property.
     */
	load(): ConfigCheckMap | string | undefined {
		const parsed: unknown = existsSync(this.path) ? yaml.parse(readFileSync(this.path).toString()) : undefined;
		if (parsed === undefined) {
			return;
		}

		const message = this.dataCheck(parsed);

		if (typeof message === 'string') {
			return message;
		}

		const object = parsed as Record<string, unknown>;
		for (const key in object) {
			if (!Object.hasOwn(object, key) || message.has(key)) {
				continue;
			}

			const element = object[key];
			this.data[key] = element;
		}

		return message;
	}

	/**
     * Saves the partial config to the file. If there are no settings, the file will be deleted, if exists.
     */
	save(): this {
		if (Object.keys(this.data).length === 0) {
			if (existsSync(this.path)) {
				rmSync(this.path);
			}

			return this;
		}

		writeFileSync(this.path, yaml.stringify(this.data));
		return this;
	}

	/**
     * Sets a new value for the specified config property.
     * Expects a valid value.
     * @param key The name of the config property.
     * @param value The new value for the config property.
     */
	set<T extends keyof ConfigType>(key: T, value: ConfigType[T]): string | undefined;
	set(key: string, value: unknown): string | undefined;
	set(key: string, value: unknown): string | undefined {
		const errorMessage = this.checkValue(key, value);
		if (errorMessage !== undefined) {
			return errorMessage;
		}

		this.data[key] = value;
	}

	/**
     * Deletes the specified property from the config.
     * If the property is not specified, then all properties will be deleted.
     * @param key The config property.
     */
	unset<T extends keyof ConfigType>(key?: T): this;
	unset(key?: string): this;
	unset(key?: string): this {
		if (key === undefined) {
			for (const key of Object.keys(this.data)) {
				delete this.data[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
			}

			return this;
		}

		delete this.data[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
		return this;
	}

	/**
     * @returns An array of properties which defined in the configuration file.
     */
	keyList(real = true): Array<keyof ConfigType> {
		const keys = real ? Array.from(this.configValidation.keys()) : Object.keys(this.data);
		return keys;
	}

	/**
     * @param key The config property.
     * @param real The options.
     * @returns The value for the specified property.
     */
	get<T extends keyof ConfigType>(key: T, options: ConfigManagerGetOptions & {real?: false}): ConfigType[T] | undefined;
	get<T extends keyof ConfigType>(key: T, options?: ConfigManagerGetOptions & {real: true}): ConfigType[T];
	get(key: string, options?: ConfigManagerGetOptions): unknown;
	get(key: string, options?: ConfigManagerGetOptions): unknown {
		const {real = true} = options ?? {};
		let value: unknown = this.data[key];
		if (real && value === undefined) {
			value = this.dataDefault[key];
			if (value === undefined) {
				throw new Error(`Excpected default value for config property '${key}'.`);
			}
		}

		return value;
	}

	getPairString<T extends keyof ConfigType>(keys?: T | T[], options?: ConfigManagerGetPairStringOptions): string;
	getPairString(keys?: string | string[], options?: ConfigManagerGetPairStringOptions): string;
	getPairString(keys?: string | string[], options?: ConfigManagerGetPairStringOptions): string {
		const {real = true, types = true, chalk, parsable} = options ?? {};
		if (keys === undefined) {
			return this.getPairString(this.keyList(real), options);
		}

		if (typeof keys === 'string') {
			return this.getPairString([keys], options);
		}

		if (parsable) {
			return keys.map((key: string) => {
				const value = format('%o', this.get(key, options));
				if (types) {
					const type = this.getType(key);
					return `${key}\n${value}\n${type}`;
				}

				return `${key}\n${value}`;
			}).join('\n');
		}

		// eslint-disable-next-line unicorn/no-array-reduce
		const keyMaxLength: number = keys.reduce((maxLength, key) => Math.max(maxLength, key.length), 0);
		return keys.map((key: string): string => {
			const value = format('%o', this.get(key, options));
			const type = this.getType(key);
			const pad = keyMaxLength - key.length;
			const line = types ? format(
				`${' '.repeat(pad)}%s ${highlight('=', chalk)} %s${highlight(':', chalk)} %s`,
				(chalk ? chalk.hex('#FFBC42')(key) : key),
				chalk ? highlight(value, chalk) : value,
				(chalk ? chalk.dim(highlight(type, chalk)) : type),
			) : format(
				`${' '.repeat(pad)}%s ${highlight('=', chalk)} %s`,
				(chalk ? chalk.hex('#FFBC42')(key) : key),
				chalk ? highlight(value, chalk) : value,
			);

			return line;
		}).join('\n');
	}
}

/**
 * File-specific actions container. Contains get, set, unset, save, load and other configuration actions.
 * @public
 */
export const configManager = new ConfigManager(configFilePath);
