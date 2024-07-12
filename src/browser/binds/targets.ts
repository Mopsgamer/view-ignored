import { LookFolderOptions, Source } from "../lib.js"

export interface TargetBind {
    /**
     * The target simple name.
     * @see {@link isValidId}
     */
    id: string
    /**
     * The target readable name.
     */
    name: string
    /**
     * The walkthrough. Files including patterns.
     */
    sources: Source[]
    /**
     * Folder deep scanning options for the target.
     */
    scanOptions?: LookFolderOptions
    /**
     * Test command.
     * @example
     * "npm pack --dry run"
     * "vsce ls"
     */
    testCommad?: string
}

/**
 * @param id The target simple name.
 * @returns `true` if the target id is valid.
 */
export function isValidId(id: unknown): boolean {
    return typeof id === "string" && id.match(/^[-a-zA-Z0-9]+$/) != null
}

/**
 * The container for binds: id=bind.
 */
const targetBindMap = new Map<string, TargetBind>()

/**
 * Allows to create targets for view-ignored scan* functions.
 * @example
 * scanProject("abc") // error
 * Bindings.targetSet("abc", {...})
 * scanProject("abc") // ok
 */
export function targetSet(bind: TargetBind): void {
    if (!isValidId(bind.id)) {
        throw TypeError(`view-ignored can not bind target with id '${bind.id}'`)
    }
    targetBindMap.set(bind.id, bind)
}

/**
 * Get all target ids.
 * @example
 * ["git", "npm", "vsce", ...]
 */
export function targetList(): string[] {
    return Array.from(targetBindMap.keys())
}

/**
 * Get target bind by target id.
 * @param id Target id.
 */
export function targetGet(id: string): TargetBind | undefined {
    if (!isValidId(id)) {
        throw TypeError(`view-ignored can not get bind for target with id '${id}'`)
    }
    return targetBindMap.get(id)
}