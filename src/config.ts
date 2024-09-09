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
	type FilterName, type Sorting, type Styling,
} from './browser/index.js';
import {type ColorType} from './styling.js';
import {type ConfigCheckMap} from './errors.js';

/**
 * The full config file name - `".view-ignored"`.
 */
export const configFileName = '.view-ignored';

/**
 * The user's home directory + the config file name.
 * @see {@link os.homedir}
 */
const configFilePath = path.join(os.homedir(), configFileName);

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
export type ConfigValidator = ((value: unknown) => string | undefined) & {
	typeName: string;
};

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

export const trueValues = ['true', 'on', 'yes', 'y', 'enable', 'enabled', '1'];
export const falseValues = ['false', 'off', 'no', 'n', 'disable', 'disabled', '0'];
export const booleanValues = trueValues.concat(falseValues);
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

export type ConfigManagerGetOptions = {
	/**
	 * Use default value as fallback.
	 * @default true
	 */
	real?: boolean;
};

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
};

/**
 * File-specific actions container.
 */
export class ConfigManager<ConfigType extends Record<string, unknown> = Config> {
	/**
	 * Do not change this value directly.
	 * @see {@link configManager}.
	 */
	private data: Record<string, unknown> = {};
	private readonly configValidation = new Map<string, ConfigValidator>();
	private readonly cliOptionLinkMap = new Map<string, Option>();
	private readonly dataDefault: Record<string, unknown> = {};

	constructor(
		public readonly path: string,
	) {}

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

			const message = this.checkValue(key, value);
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
	keyTypeName<T extends keyof ConfigType>(key: T): string;
	keyTypeName(key: string): string;
	keyTypeName(key: string): string {
		return this.configValidation.get(key)?.typeName ?? 'any';
	}

	/**
	 * Get type checker for the key.
	 */
	keyGetValidator<T extends keyof ConfigType>(key: T): ConfigValidator | undefined;
	keyGetValidator(key: string): ConfigValidator | undefined;
	keyGetValidator(key: string): ConfigValidator | undefined {
		return this.configValidation.get(key);
	}

	/**
	 * Define type checker for the key.
	 */
	keySetValidator<T extends keyof ConfigType>(key: T, defaultValue: ConfigType[T], type: ConfigValidator): this;
	keySetValidator(key: string, defaultValue: unknown, type: ConfigValidator): this;
	keySetValidator(key: string, defaultValue: unknown, type: ConfigValidator): this {
		this.configValidation.set(key, type);
		const errorMessage = type(defaultValue);
		if (errorMessage !== undefined) {
			throw new TypeError(`Invalid default value preset for configuration key '${key}' - ${errorMessage}`);
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
	checkValue(key: keyof ConfigType, value: unknown): string | undefined;
	checkValue(key: string, value: unknown): string | undefined;
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
	keyList(real = true): string[] {
		const keys = real ? Array.from(this.configValidation.keys()) : Object.keys(this.data);
		return keys;
	}

	/**
     * @param key The config property.
     * @param real If `true`, the default value will be used when the value is `undefined`. Default `true`.
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
		const {real = true, chalk, types = true} = options ?? {};
		if (keys === undefined) {
			return this.getPairString(this.keyList(real), options);
		}

		if (typeof keys === 'string') {
			return this.getPairString([keys], options);
		}

		// eslint-disable-next-line unicorn/no-array-reduce
		const pad: number = keys.reduce((maxLength, key) => Math.max(maxLength, key.length), 0);
		return keys.map((key: string): string => {
			const string = types ? format(
				'%s = %o: %s',
				key.padStart(pad),
				this.get(key, options),
				this.keyTypeName(key),
			) : format(
				'%s = %o',
				key.padStart(pad),
				this.get(key, options),
			);
			if (chalk) {
				const colored = string
					.replaceAll(/(?<=(\s*))\w+(?=(\s+=))/g, chalk.cyan('$&'))
					.replaceAll(/(Infinity|NaN|\d+\b)/g, chalk.green('$&'))
					.replaceAll(/(true|false|undefined|null)/g, chalk.blue('$&'))
					.replaceAll(/(\||=|:|,|\.|\(|\)|{|}|\[(?!\d+m)|]|-)/g, chalk.red('$&'))
					.replaceAll(/'.+'/g, chalk.yellow('$&'));
				return colored;
			}

			return string;
		}).join('\n');
	}
}

/**
 * File-specific actions container. Contains get, set, unset, save, load and other configuration actions.
 */
export const configManager = new ConfigManager(configFilePath);
