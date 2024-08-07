import { PluginExport } from "../binds/index.js"
import { Plugins, ScanMethod, Methodology } from "../index.js"

export const id = "vsce"
export const name = "VSC Extension"
export const testCommand = "vsce ls"

export const matcherExclude: string[] = [
    ".git/**",
    ".DS_Store/**"
]

export const scan: ScanMethod = function (data) {
    const { scanner, content } = data
    const pat = content?.toString()
    if (!scanner.patternIsValid(pat)) {
        return false
    }
    scanner.add(pat)
    return true
}

export const methodology: Methodology[] = [
    { pattern: "**/.vscodeignore", matcher: "minimatch", scan, matcherExclude },
]

const bind: Plugins.TargetBind = { id, name, methodology, testCommand }
export default ({ viewignored: { addTargets: [bind] } } as PluginExport)
