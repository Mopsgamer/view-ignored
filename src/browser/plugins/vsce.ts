import { ScanMethod, Source, SourcePattern, TargetBind, targetBind } from "../../index.js"

export const id = "vsce"
export const name = "VSC Extension"
export const check = "vsce ls"


export const addPatternsExclude: string[] = [
	"**/.git/**",
	"**/.DS_Store/**"
]

export const method: ScanMethod = function (data) {
    const { looker, sourceFile: source } = data
    if (!looker.isValidPattern(source.content)) {
        return false
    }
    looker.add(source.content)
    return true
}

export const sources: Source[] = [
    { sources: new SourcePattern("**/.vscodeignore"), patternType: "minimatch", method, addPatterns: addPatternsExclude },
]

const bind: TargetBind = {id, name, sources, check}
targetBind(bind)
export default bind
