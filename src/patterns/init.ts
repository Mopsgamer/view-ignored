import type { InitState } from "./initState.js"

/**
 * Initializes the target. For example,
 * Yarn reads `package.json` to find `main` and `bin` values,
 * so it can forcefully include them.
 *
 * @since 0.8.0
 */
export type Init = (options: InitState) => Promise<void>
