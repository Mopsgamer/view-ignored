import { ScanFolderOptions, Methodology, isMethodology } from "../lib.js"
import { StyleCondition } from "../styling.js"

export interface TargetBind {
    /**
     * Simple name.
     * @see {@link isValidId}
     */
    id: string

    /**
     * Readable name.
     */
    name: string | StyleCondition

    /**
     * The walkthrough. Files including patterns.
     */
    methodology: Methodology[]

    /**
     * Folder deep scanning options for the target.
     */
    scanOptions?: ScanFolderOptions

    /**
     * Test command.
     * @example
     * "npm pack --dry run"
     * "vsce ls"
     */
    testCommand?: string
}

export function isTargetBind(value: unknown): value is TargetBind {
    if (value?.constructor !== Object) {
        return false
    }

    const v = value as Record<string, unknown>

    return (isValidId(v.id))
        && (typeof v.name === "string" || v.name?.constructor === Object)
        && (Array.isArray(v.methodology) && v.methodology.every(isMethodology))
        && (v.scanOptions === undefined || v.scanOptions?.constructor === Object)
        && (v.testCommand === undefined || typeof v.testCommand === "string")
}

/**
 * @param id The target simple name.
 * @returns `true` if the target id is valid.
 */
export function isValidId(id: unknown): id is string {
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
    const list = Array.from(targetBindMap.keys())
    return list
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