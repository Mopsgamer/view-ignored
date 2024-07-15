import { loadPlugin as load } from "load-plugin"

export * from "./targets.js"

export async function loadPlugin(module: string): Promise<void> {
    load(module)
}