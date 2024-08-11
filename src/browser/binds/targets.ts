
import {
	type ScanFolderOptions, type Methodology, isMethodology, scanProject,
} from '../lib.js';
import {type DecorConditionOptions} from '../styling.js';

/**
 * Should satisfy RegExp: `/^[-a-zA-Z0-9]+$/`.
 */
export type TargetId = string;

/**
 * @param value Target's id. Simple name.
 * @returns `true`, if the id is available for binding.
 */
export function isTargetId(value: unknown): value is TargetId {
	return typeof value === 'string' && (/^[-a-zA-Z\d]+$/.exec(value)) != null;
}

/**
 * The bind which allows use predefined options for scan functions.
 * @see {@link scanProject}
 */
export type TargetBind = {
	/**
     * Simple name.
     * @see {@link isTargetId}
     */
	id: TargetId;

	/**
     * Readable name.
     */
	name: string | DecorConditionOptions;

	/**
     * The walkthrough. Files including patterns.
     */
	methodology: Methodology[];

	/**
     * Folder deep scanning options for the target.
     */
	scanOptions?: ScanFolderOptions;

	/**
     * Test command.
     * @example
     * "npm pack --dry run"
     * "vsce ls"
     */
	testCommand?: string;
};

/**
 * Checks if the value is the {@link TargetBind}.
 */
export function isTargetBind(value: unknown): value is TargetBind {
	if (value?.constructor !== Object) {
		return false;
	}

	const v = value as Record<string, unknown>;

	return (isTargetId(v.id))
        && (typeof v.name === 'string' || v.name?.constructor === Object)
        && (Array.isArray(v.methodology) && v.methodology.every(isMethodology))
        && (v.scanOptions === undefined || v.scanOptions?.constructor === Object)
        && (v.testCommand === undefined || typeof v.testCommand === 'string');
}

/**
 * The container for binds: id=bind.
 */
const targetBindMap = new Map<string, TargetBind>();

/**
 * Allows to create targets for view-ignored scan* functions.
 * @example
 * scanProject("abc") // error
 * Bindings.targetSet("abc", {...})
 * scanProject("abc") // ok
 */
export function targetSet(bind: TargetBind): void {
	if (!isTargetId(bind.id)) {
		throw new TypeError(`view-ignored can not bind target with id '${bind.id}'`);
	}

	targetBindMap.set(bind.id, bind);
}

/**
 * Get all target ids.
 * @example
 * ["git", "npm", "vsce", ...]
 */
export function targetList(): string[] {
	const list = Array.from(targetBindMap.keys());
	return list;
}

/**
 * Get target bind by target id.
 * @param id Target id.
 */
export function targetGet(id: TargetId): TargetBind | undefined {
	return targetBindMap.get(id);
}
