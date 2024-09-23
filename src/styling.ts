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

export function highlight(text: string, chalk?: ChalkInstance): string {
	if (chalk === undefined) {
		return text;
	}

	const rtype = /^(?<=\s*)(switch|boolean|object|string|number|integer)(\[])*(?=\s*)$/;
	if (rtype.test(text)) {
		return chalk.hex('#9999ff')(text);
	}

	const rseparator = /([,.\-:="|])/g;
	const rstring = /'[^']+'/g;
	const rbracketsSquare = /(\[|])/g;
	const rnumber = /\d+/g;
	const rspecial = /(true|false|null|Infinity)/g;

	const rall = new RegExp(`${
		[ansiRegex(), rstring, rseparator, rbracketsSquare, rnumber, rspecial]
			.map(r => `(${typeof r === 'string' ? r : r.source})`)
			.join('|')
	}`, 'g');

	const colored = text.replaceAll(rall, match => {
		if (match.match(ansiRegex()) !== null) {
			return match;
		}

		if (match.match(rstring) !== null) {
			return match.replace(/^'[^']*'$/, chalk.hex('#A2D2FF')('$&'));
		}

		if (match.match(rseparator) !== null) {
			return chalk.hex('#D81159')(match);
		}

		if (match.match(rbracketsSquare) !== null) {
			return chalk.hex('#B171D9')(match);
		}

		if (match.match(rnumber) !== null) {
			return chalk.hex('#73DEA7')(match.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ','));
		}

		if (match.match(rspecial) !== null) {
			return chalk.hex('#73DEA7')(match);
		}

		return match;
	});
	return colored;
}
