import { Binding, ScanMethod, Source, SourcePattern } from "../index.js"

export const id = "vsce"
export const name = "VSC Extension"
export const check = "vsce ls"


export const addPatternsExclude: string[] = [
    "**/.git/**",
    "**/.DS_Store/**"
]

export const method: ScanMethod = function (data) {
    const { matcher, sourceFile: source } = data
    if (!matcher.isValidPattern(source.content)) {
        return false
    }
    matcher.add(source.content)
    return true
}

export const sources: Source[] = [
    { sources: new SourcePattern("**/.vscodeignore"), patternType: "minimatch", method, addPatterns: addPatternsExclude },
]

const bind: Binding.TargetBind = { id, name, sources, testCommad: check }
Binding.targetSet(bind)
export default bind
