import { Binding, ScanMethod, Methodology } from "../index.js"

export const id = "git"
export const name = "Git"
export const check = `git ls-tree -r <git-branch-name> --name-only`

export const addPatternsExclude: string[] = [
    "**/.git/**",
    "**/.DS_Store/**"
]

export const scan: ScanMethod = function (data) {
    const { matcher, source } = data
    const pat = source.content?.toString()
    if (!matcher.isValidPattern(pat)) {
        return false
    }
    matcher.add(pat!)
    return true
}

export const methodology: Methodology[] = [
    { pattern: "**/.gitignore", patternType: ".*ignore", scan: scan, addPatterns: addPatternsExclude },
]

const bind: Binding.TargetBind = { id, name, methodology, testCommad: check }
Binding.targetSet(bind)
export default bind
