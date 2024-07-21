import { PluginExport } from "../binds/index.js"
import { Plugins, ScanMethod, Methodology, Styling } from "../index.js"

const id = "git"
const name: Styling.DecorConditionOptions = {
    ifNormal: "Git",
    ifNerd: "\ue65d Git"
}
const testCommand = `git ls-tree -r <git-branch-name> --name-only`

const addPatternsExclude: string[] = [
    "**/.git/**",
    "**/.DS_Store/**"
]

const scan: ScanMethod = function (data) {
    const { matcher, source } = data
    const pat = source.content?.toString()
    if (!matcher.isValidPattern(pat)) {
        return false
    }
    matcher.add(pat!)
    return true
}

const methodology: Methodology[] = [
    { pattern: "**/.gitignore", patternType: ".*ignore", scan: scan, addPatterns: addPatternsExclude },
]

const bind: Plugins.TargetBind = { id, name, methodology, testCommand }
export default ({ viewignored_addTargets: [bind] } as PluginExport)
