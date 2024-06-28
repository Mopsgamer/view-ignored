import { LookMethod, LookFolderOptions, Source, SourcePattern, TargetBind, targetBind } from "../../index.js"
import getValue from "get-value";

export const id = "npm"
export const name = "NPM"
export const check = "npm pack --dry-run"

export const npmPatternExclude = [
    '.*.swp',
    '._*',
    '.DS_Store',
    '.git',
    '.gitignore',
    '.hg',
    '.npmignore',
    '.npmrc',
    '.lock-wscript',
    '.svn',
    '.wafpickle-*',
    'config.gypi',
    'CVS',
    'npm-debug.log',
];
export const npmPatternInclude = [
    'bin/',
    'package.json',
    'README',
    'README.*',
    'LICENSE',
    'LICENSE.*',
    'LICENCE',
    'LICENCE.*',
];

export const methodGit: LookMethod = function (data) {
    const { looker, sourceFile: source } = data
    looker.patternType = "minimatch"
    if (!looker.isValidPattern(source.content)) {
        return false
    }
    looker.add(source.content)
    return true
}

export const methodPackageJsonFiles: LookMethod = function (data) {
    const { looker, sourceFile: source } = data
    looker.isNegated = true
    let parsed: object
    try {
        const json = JSON.parse(source.content)
        if (json?.constructor !== Object) {
            return false
        }
        parsed = json
    } catch {
        return false
    }
    const propVal = getValue(parsed, "files")
    if (!Array.isArray(propVal)) {
        return false
    }
    looker.add(propVal)
    return true
}

export const sources: Source[] = [
    { sources: new SourcePattern("**/package.json"), patternType: "minimatch", method: methodPackageJsonFiles },
    { sources: new SourcePattern("**/.npmignore"), patternType: ".*ignore", method: methodGit },
    { sources: new SourcePattern("**/.gitignore"), patternType: ".*ignore", method: methodGit },
]

export const scanOptions: LookFolderOptions = {
    addPatterns: npmPatternInclude,
    ignore: npmPatternExclude,
}

const bind: TargetBind = {id, name, sources, scanOptions, check}
targetBind(bind)
export default bind
