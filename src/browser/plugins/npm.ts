import { Binding, ScanMethod, Source, SourcePattern } from "../index.js"
import getValue from "get-value";

export const id = "npm"
export const name = "NPM"
export const check = "npm pack --dry-run"

export const addPatternsExclude = [
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
export const addPatternsInclude = [
    'bin/',
    'package.json',
    'README',
    'README.*',
    'LICENSE',
    'LICENSE.*',
    'LICENCE',
    'LICENCE.*',
];

export const methodGit: ScanMethod = function (data) {
    const { looker, sourceFile: source } = data
    looker.patternType = "minimatch"
    if (!looker.isValidPattern(source.content)) {
        return false
    }
    looker.add(source.content)
    return true
}

export const methodPackageJsonFiles: ScanMethod = function (data) {
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
    { sources: new SourcePattern("**/package.json"), patternType: "minimatch", method: methodPackageJsonFiles, addPatterns: addPatternsInclude },
    { sources: new SourcePattern("**/.npmignore"), patternType: ".*ignore", method: methodGit, addPatterns: addPatternsExclude },
    { sources: new SourcePattern("**/.gitignore"), patternType: ".*ignore", method: methodGit, addPatterns: addPatternsExclude },
]


const bind: Binding.TargetBind = { id, name, sources, check }
Binding.targetSet(bind)
export default bind
