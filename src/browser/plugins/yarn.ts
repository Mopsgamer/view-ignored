import { PluginExport } from "../binds/index.js";
import { Plugins, Methodology, ScanMethod } from "../index.js"
import getValue from "get-value";

export const id = "yarn"
export const name = "Yarn"

/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
export const addPatternsExclude = [
    'node_modules',
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
/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
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

export const scanGit: ScanMethod = function(data) {
    const { scanner, source } = data
    scanner.patternType = "minimatch"
    const pat = source.content?.toString()
    if (!scanner.isValidPattern(pat)) {
        return false
    }
    scanner.add(pat!)
    return true
}

export const scanPackageJsonFiles: ScanMethod = function(data) {
    const { scanner, source } = data
    scanner.isNegated = true
    let parsed: object
    try {
        const pat = source.content?.toString()
        if (!pat) {
            return false
        }

        const json = JSON.parse(pat)
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
    scanner.add(propVal)
    return true
}

export const methodology: Methodology[] = [
    { pattern: "**/package.json", patternType: "minimatch", scan: scanPackageJsonFiles, addPatterns: addPatternsInclude },
    { pattern: "**/.yarnignore", patternType: ".*ignore", scan: scanGit, addPatterns: addPatternsExclude },
    { pattern: "**/.npmignore", patternType: ".*ignore", scan: scanGit, addPatterns: addPatternsExclude },
    { pattern: "**/.gitignore", patternType: ".*ignore", scan: scanGit, addPatterns: addPatternsExclude },
]

const bind: Plugins.TargetBind = { id, name, methodology }
export default ({ viewignored_addTargets: [bind] } as PluginExport)
