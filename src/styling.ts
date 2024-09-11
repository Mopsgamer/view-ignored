import ansiRegex from 'ansi-regex';
import {type ChalkInstance, type ColorSupportLevel} from 'chalk';

export * from './browser/styling.js';

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
	const numberValue = Number(value);
	return Number.isFinite(numberValue) && colorTypeList.includes(numberValue as ColorType);
}

export function highlight(text: string, chalk: ChalkInstance): string {
	const rchar = /([,.\-:="|])/g;
	const rstring = /'[A-Za-z]+'/g;
	const rbrackets = /(\[|])/g;
	const rnumber = /\d+/g;
	const rspecial = /(true|false|null|Infinity)/g;

	const rall = new RegExp(`${
		[ansiRegex(), rchar, rstring, rbrackets, rnumber, rspecial]
			.map(r => `(${typeof r === 'string' ? r : r.source})`)
			.join('|')
	}`, 'g');

	const colored = text.replaceAll(rall, match => {
		if (match.match(ansiRegex()) !== null) {
			return match;
		}

		if (match.match(rchar) !== null) {
			return chalk.red(match);
		}

		if (match.match(rstring) !== null) {
			return match.replace(/^'[A-Za-z]+'$/, chalk.yellow('$&'));
		}

		if (match.match(rbrackets) !== null) {
			return chalk.magenta(match);
		}

		if (match.match(rnumber) !== null) {
			return chalk.green(match);
		}

		if (match.match(rspecial) !== null) {
			return chalk.blue(match);
		}

		return match;
	});
	return colored;
}
