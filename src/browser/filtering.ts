/**
 * Contains all filter names.
 * @public
 */
export const filterNameList = ['ignored', 'included', 'all'] as const;

/**
 * Contains all filter names as a type.
 * @public
 */
export type FilterName = typeof filterNameList[number];

/**
 * Checks if the value is the {@link FilterName}.
 * @public
 */
export function isFilterName(value: unknown): value is FilterName {
	return typeof value === 'string' && filterNameList.includes(value as FilterName);
}
