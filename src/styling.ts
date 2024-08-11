import {type ChalkInstance} from 'chalk';
import {decorCondition, type DecorName} from './browser/styling.js';
import {
	configFilePath, type ConfigKey, type ConfigPair, configValueList, isConfigKey, isConfigValue,
} from './config.js';

export * from './browser/styling.js';

export function formatConfigConflicts(chalk: ChalkInstance, decor: DecorName, error: unknown): void {
	if (!(error instanceof TypeError && error.cause?.constructor === Object)) {
		throw error;
	}

	const entries = Object.entries(error.cause);
	if (entries === undefined) {
		console.error('An object expected.');
		return;
	}

	if (entries.length === 0) {
		return;
	}

	const badEntries = entries.filter(
		([key, value]) => {
			// Keys can be undefined
			if (!isConfigKey(key)) {
				return false;
			}

			if (isConfigValue(key, value)) {
				return false;
			}

			// Bad config value
			return true;
		},
	) as ConfigPair[];

	if (badEntries.length === 0) {
		return;
	}

	let message = 'Configuration invalid properties:\n';
	const prefix = chalk.redBright(decorCondition(decor, {
		ifNerd: '\uDB82\uDE15', ifNormal: '-', postfix: ' ', prefix: ' ',
	}));
	message += badEntries.map(
		([key, value]) => {
			const choices = configValueList(key);
			const errorMessage = choices === undefined ? '' : decorCondition(decor, {ifNormal: typeof choices === 'string' ? choices : `Choices: ${choices.join(', ')}.`, prefix});
			return '\t' + chalk.reset(`${key}=${String(value)}`) + chalk.red(errorMessage);
		},
	).join('\n');
	console.error(message);
	console.log();
	console.log(configFilePath);
}
