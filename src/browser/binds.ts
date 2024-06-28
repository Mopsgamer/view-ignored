import { LookFolderOptions, Source } from "./lib.js"

export interface TargetBind {
	id: string
	name: string
    sources: Source[]
    scanOptions: LookFolderOptions
    /**
     * Check command hint.
     * 
     * @example
     * "npm pack --dry run"
     * "vsce ls"
     */
    check?: string
}
export const targetBindMap: Map<string, TargetBind> = new Map()
export function isValidTargetId(id: unknown) {
    return typeof id === "string" && id.match(/^[-a-zA-Z0-9]+$/) != null
} 
/**
 * Allows to create defaults.
 */
export function targetBind(bind: TargetBind) {
    if (!isValidTargetId(bind.id)) {
        throw TypeError(`view-ignored can not bind target with id '${bind.id}'`)
    }
    targetBindMap.set(bind.id, bind)
}