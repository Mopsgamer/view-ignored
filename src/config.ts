import * as os from 'node:os';
import path from 'node:path';
import {
	existsSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import * as yaml from 'yaml';
import {type ColorSupportLevel} from 'chalk';
import {type Command, type Option} from 'commander';
import {
	type FilterName, type Sorting, type Styling,
} from './browser/index.js';

/**
 * Contains all color level names.
 */
export const colorTypeList = [0, 1, 2, 3] as const;
/**
 * Contains all color level names as a type.
 */
export type ColorType = ColorSupportLevel;
/**
 * Checks if the value is the {@link ColorType}.
 */
export function isColorType(value: unknown): value is ColorType {
	const number_ = Number(value);
	return Number.isFinite(number_) && colorTypeList.includes(number_ as ColorType);
}

/**
 * The full config file name - `".view-ignored"`.
 */
export const configFileName = '.view-ignored';

/**
 * The user's home directory + the config file name.
 * @see {@link os.homedir}
 */
export const configFilePath = path.join(os.homedir(), configFileName);

/**
 * Command-line configuration property list.
 */
export const configKeyList = ['color', 'target', 'filter', 'sort', 'style', 'decor', 'depth', 'showSources', 'plugins', 'parsable'] as const satisfies ReadonlyArray<keyof Config>;

/**
 * Command-line configuration's key type.
 */
export type ConfigKey = typeof configKeyList[number] & keyof Config;

export type ConfigValue<KeyT extends ConfigKey = ConfigKey> = Config[KeyT];

export type ShowSourcesType = boolean;

export function isShowSources(value: unknown): value is ShowSourcesType {
	return typeof value === 'boolean';
}

/**
 * Represents array with the key nad the value.
 */
export type ConfigPair<KeyT extends ConfigKey = ConfigKey> = [key: KeyT, value: ConfigValue<KeyT>];

/**
 * Command-line configuration structure.
 * @see {@link configKeyList} Before adding new properties.
 */
export type Config = {
	parsable: boolean;
	plugins: string[];
	color: ColorType;
	target: string;
	filter: FilterName;
	sort: Sorting.SortName;
	style: Styling.StyleName;
	decor: Styling.DecorName;
	depth: number;
	showSources: ShowSourcesType;
};

/**
 * Command-line default config values.
 */
export const configDefault: Readonly<Config> = {
	parsable: false,
	plugins: [],
	color: 3,
	target: 'git',
	filter: 'included',
	sort: 'firstFolders',
	style: 'tree',
	decor: 'normal',
	depth: Infinity,
	showSources: false,
};

/**
 * @returns Error message and parsed value.
 */
export type ConfigValueValidator = ((value: unknown) => string | undefined);

export const configValueArray = <T extends ConfigValueValidator>(type?: T) => ((value => {
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
}) as ConfigValueValidator);

export const configValueLiteral = (choices: readonly unknown[]) => ((value => {
	if (choices.includes(value)) {
		return;
	}

	return `The value is invalid. Choices: ${choices.map(String).join(', ')}.`;
}) as ConfigValueValidator);

export const trueValues = ['true', 'on', 'yes', 'y', 'enable', 'enabled', '1'];
export const falseValues = ['false', 'off', 'no', 'n', 'disable', 'disabled', '0'];
export const booleanValues = trueValues.concat(falseValues);
export const configValueHumanBoolean: ConfigValueValidator = value => {
	if (booleanValues.includes(value as string)) {
		return;
	}

	return `The value should be a boolean. Available boolean literals: ${booleanValues.join(', ')}.`;
};

export const configValueBoolean: ConfigValueValidator = value => {
	if (typeof value === 'boolean') {
		return;
	}

	return 'The value should be a boolean.';
};

export const configValueObject: ConfigValueValidator = value => {
	if (value?.constructor === Object) {
		return;
	}

	return 'The value should be an object.';
};

export const configValueString: ConfigValueValidator = value => {
	if (typeof value === 'string') {
		return;
	}

	return 'The value should be a string.';
};

export const configValueNumber: ConfigValueValidator = value => {
	if (typeof value === 'number') {
		return;
	}

	return 'The value should be a number.';
};

export const configValueInteger: ConfigValueValidator = value => {
	if (typeof value === 'number' && (Number.isSafeInteger(value) || Math.abs(value) === Infinity)) {
		return;
	}

	return 'The value should be an integer.';
};

/**
 * File-specific actions container.
 */
class ConfigManager<ConfigType extends Record<string, unknown> = Config> {
	/**
	 * Do not change this value directly.
	 * @see {@link configManager}.
	 */
	private data: Record<string, unknown> = {};
	private readonly configType = new Map<string, ConfigValueValidator>();
	private readonly cliOptionLinkMap = new Map<string, Option>();
	private readonly dataDefault: Record<string, unknown> = {};

	constructor(
		public readonly path: string,
	) {}

	/**
	 * @returns Data object clone.
	 */
	dataRaw(): unknown {
		return structuredClone(this.data);
	}

	/**
	 * Define type check for the key.
	 */
	key<T extends keyof ConfigType>(key: T, defaultValue: ConfigType[T], type: ConfigValueValidator): this;
	key(key: string, defaultValue: unknown, type: ConfigValueValidator): this;
	key(key: string, defaultValue: unknown, type: ConfigValueValidator): this {
		this.configType.set(key, type);
		const errorMessage = type(defaultValue);
		if (errorMessage !== undefined) {
			throw new TypeError(`Invalid default value preset for configuration key '${key}' - ${errorMessage}`);
		}

		this.dataDefault[key] = defaultValue;
		return this;
	}

	checkKey(key: string) {
		if (this.configType.has(key)) {
			return;
		}

		return `Unknown config key '${key}'. Choices: ${Array.from(this.configType.keys()).join(', ')}`;
	}

	/**
	 * Define type check for the key.
	 */
	checkValue(key: keyof ConfigType, value: unknown): string | undefined;
	checkValue(key: string, value: unknown): string | undefined;
	checkValue(key: string, value: unknown): string | undefined {
		const validate = this.configType.get(key);
		if (validate === undefined) {
			return;
		}

		return validate(value);
	}

	/**
	 * Link a configuration property with a command-line option.
	 */
	setOption(key: string, command: Command, option: Option, parseArgument?: (argument: string) => unknown): this;
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
     * Loads the config from the file to {@link configManager.data}. If the data is not valid, throws an error without loading.
     * @returns Array of error messages if the config file contains invalid properties.
     */
	load(): string[] {
		const errorMessageList: string[] = [];
		const parsed: unknown = existsSync(this.path) ? yaml.parse(readFileSync(this.path).toString()) : undefined;
		if (parsed === undefined) {
			return errorMessageList;
		}

		const object = parsed as Record<string, string>;
		if (object?.constructor !== Object) {
			errorMessageList.push(configValueObject(object)!);
			return errorMessageList;
		}

		for (const key in object) {
			if (!Object.hasOwn(object, key)) {
				continue;
			}

			const element = object[key];

			let errorMessage = this.checkValue(key, element);
			if (errorMessage === undefined) {
				continue;
			}

			if (errorMessageList.length > 0) {
				errorMessage = '\n' + errorMessage;
			}

			errorMessageList.push(errorMessage);
		}

		if (errorMessageList.length > 0) {
			return errorMessageList;
		}

		Object.assign(this.data, parsed);
		return errorMessageList;
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
	definedKeys(): string[] {
		const keys = Object.keys(this.data);
		return keys.filter(k => this.data[k] !== undefined);
	}

	/**
     * @param key The config property.
     * @param real If `true`, the default value will be used when the value is `undefined`. Default `true`.
     * @returns The value for the specified property.
     */
	get<T extends keyof ConfigType>(key: T, real: false | boolean): ConfigType[T] | undefined;
	get<T extends keyof ConfigType>(key: T, real?: true): ConfigType[T];
	get(key: string, real?: boolean): unknown;
	get(key: string, real = true): unknown {
		const value = this.data[key];
		if (real && value === undefined) {
			const value = this.dataDefault[key];
			if (value === undefined) {
				throw new Error(`Excpected default value for config property '${key}'.`);
			}

			return value;
		}

		return value;
	}

	/**
     * @param key The config property.
     * @param real If `true`, the default value will be used when the value is `undefined`. Default `true`.
     * @returns A string in the `"key=value"` format, if the property is specified.
     * Otherwise in format `"key=value\nkey=value\n..."` without the '\n' ending.
     */
	getPairString<T extends keyof ConfigType>(key?: T, real?: boolean): string;
	getPairString(key?: string, real?: boolean): string;
	getPairString(key?: string, real = true): string {
		if (key === undefined) {
			return configKeyList.map(key => this.getPairString(key, real)).filter(Boolean).join('\n');
		}

		const value = this.get(key as keyof ConfigType, real);
		return value === undefined ? '' : `${key}=${String(value)}`;
	}
}

/**
 * File-specific actions container. Contains get, set, unset, save, load and other configuration actions.
 */
export const configManager = new ConfigManager(configFilePath);
