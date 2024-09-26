
import {
	type ScanFolderOptions, type Methodology,
} from '../lib.js';

/**
 * The target icon/logo as a NF icon.
 */
export type TargetIcon = {
	/**
     * Glyph character.
     */
	char: string;
	/**
     * The icon's color.
     */
	color?: number;
};

export type TargetName = string;

/**
 * Should satisfy RegExp: `/^[-a-zA-Z0-9]+$/`.
 */
export type TargetId = string;

/**
 * @param value Target's id. Simple name.
 * @returns `true`, if the id is available for binding.
 */
export function isTargetId(value: unknown): value is TargetId {
	return typeof value === 'string' && (/^[-a-zA-Z\d]+$/.exec(value)) !== null;
}

/**
 * The bind which allows use predefined options for scan functions.
 * @see {@link scanFolder}
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
	name: TargetName;

	/**
     * Optional icon/logo.
     */
	icon?: TargetIcon;

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
	return value?.constructor === Object;
}

/**
 * The container for binds: id=bind.
 */
const targetBindMap = new Map<string, TargetBind>();

/**
 * Allows to create targets for view-ignored scan* functions.
 * @example
 * scanFolder("abc") // error
 * Bindings.targetSet("abc", {...})
 * scanFolder("abc") // ok
 */
export function targetSet(bind: TargetBind): void {
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
