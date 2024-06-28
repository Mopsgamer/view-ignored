import { LookMethod, Source, SourcePattern, LookFolderOptions, TargetBind, targetBind } from "../../index.js"

export const id = "vsce"
export const name = "VSC Extension"
export const check = "vsce ls"

export const method: LookMethod = function (data) {
    const { looker, sourceFile: source } = data
    if (!looker.isValidPattern(source.content)) {
        return false
    }
    looker.add(source.content)
    return true
}

export const sources: Source[] = [
    { sources: new SourcePattern("**/.gitignore"), patternType: ".*ignore", method },
]

export const scanOptions: LookFolderOptions = {
    allowRelativePaths: false,
}

const bind: TargetBind = {id, name, sources, scanOptions, check}
targetBind(bind)
export default bind
