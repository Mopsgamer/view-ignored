import { ChalkInstance } from "chalk";
import { decorCondition, DecorName } from "./browser/styling.js";
import { configFilePath, ConfigKey, ConfigPair, configValueList, isConfigKey, isConfigValue } from "./config.js";
export * from "./browser/styling.js"

export function formatConfigConflicts(chalk: ChalkInstance, decor: DecorName, error: unknown): void {
    if (!(error instanceof TypeError && error.cause?.constructor === Object)) {
        throw error;
    }

    const entries = Object.entries(error.cause)
    if (entries === undefined) {
        console.error('An object expected.')
        return
    }
    if (entries.length === 0) {
        return
    }

    const badEntries = entries.filter(
        ([key, value]) => {
            // keys can be undefined
            if (!isConfigKey(key)) {
                return false
            }

            if (isConfigValue(key, value)) {
                return false
            }

            // bad config value
            return true
        }
    ) as ConfigPair<ConfigKey>[]

    if (badEntries.length === 0) {
        return
    }

    let message = 'Configuration invalid properties:\n'
    const prefix = chalk.redBright(decorCondition(decor, { ifNerd: '\udb82\ude15', ifNormal: '-', postfix: ' ', prefix: ' ' }))
    message += badEntries.map(
        ([key, value]) => {
            const choices = configValueList(key)
            const errorMessage = choices === undefined ? '' : decorCondition(decor, { ifNormal: typeof choices === "string" ? choices : `Choices: ${choices.join(', ')}.`, prefix })
            return '\t' + chalk.reset(`${key}=${value}`) + chalk.red(errorMessage)
        }
    ).join('\n')
    console.error(message)
    console.log()
    console.log(configFilePath)
}