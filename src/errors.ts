import { type ConfigKey } from './config.js'

export * from './browser/errors.js'

/**
 * For each property of the configuration we have an error message.
 */
export type ConfigCheckMap = Map<string | ConfigKey, string>
