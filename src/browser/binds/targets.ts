import { LookFolderOptions, Source } from "../lib.js"

export interface TargetBind {
    id: string
    name: string
    sources: Source[]
    scanOptions?: LookFolderOptions
    /**
     * Check command hint.
     * 
     * @example
     * "npm pack --dry run"
     * "vsce ls"
     */
    check?: string
}

export function isValidId(id: unknown) {
    return typeof id === "string" && id.match(/^[-a-zA-Z0-9]+$/) != null
}
const targetBindMap = new Map<string, TargetBind>()

/**
 * Allows to create targets for view-ignored scan* functions.
 * 
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
 * 
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