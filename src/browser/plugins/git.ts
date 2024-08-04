import { PluginExport } from "../binds/index.js"
import { Plugins, ScanMethod, Methodology, Styling } from "../index.js"

const id = "git"
const name: Styling.DecorConditionOptions = {
    ifNormal: "Git",
    ifNerd: "\ue65d Git"
}
const testCommand = `git ls-tree -r <git-branch-name> --name-only`

const matcherExclude: string[] = [
    ".git/**",
    ".DS_Store/**"
]

const scan: ScanMethod = function (data) {
    const { scanner, content } = data
    const pat = content?.toString()
    if (!scanner.patternIsValid(pat)) {
        return false
    }
    scanner.add(pat)
    return true
}

const methodology: Methodology[] = [
    { pattern: "**/.gitignore", matcher: "gitignore", scan, matcherExclude },
]

const bind: Plugins.TargetBind = { id, name, methodology, testCommand }
export default ({ viewignored_addTargets: [bind] } as PluginExport)
