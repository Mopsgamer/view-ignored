import {type ColorSupportLevel} from 'chalk';

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
