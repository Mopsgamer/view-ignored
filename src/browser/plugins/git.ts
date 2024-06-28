import { LookMethod, LookFolderOptions, Source, SourcePattern, TargetBind, targetBind } from "../../index.js"

export const id = "git"
export const name = "Git"
export const check = `git ls-tree -r <git-branch-name> --name-only`

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
