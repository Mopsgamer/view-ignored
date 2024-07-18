import { PluginExport } from "../binds/index.js"
import { Plugins, ScanMethod, Methodology } from "../index.js"

export const id = "vsce"
export const name = "VSC Extension"
export const testCommand = "vsce ls"

export const addPatternsExclude: string[] = [
    "**/.git/**",
    "**/.DS_Store/**"
]

export const scan: ScanMethod = function(data) {
    const { matcher, source } = data
    const pat = source.content?.toString()
    if (!matcher.isValidPattern(pat)) {
        return false
    }
    matcher.add(pat!)
    return true
}

export const methodology: Methodology[] = [
    { pattern: "**/.vscodeignore", patternType: "minimatch", scan: scan, addPatterns: addPatternsExclude },
]

const bind: Plugins.TargetBind = { id, name, methodology, testCommand }
export default ({ viewignored_addTargets: [bind] } as PluginExport)
