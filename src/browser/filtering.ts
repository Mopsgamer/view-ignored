/**
 * Contains all filter names.
 */
export const filterNameList = ['ignored', 'included', 'all'] as const;

/**
 * Contains all filter names as a type.
 */
export type FilterName = typeof filterNameList[number];

/**
 * Checks if the value is the {@link FilterName}.
 */
export function isFilterName(value: unknown): value is FilterName {
	return typeof value === 'string' && filterNameList.includes(value as FilterName);
}
