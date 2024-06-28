import { Source, SourcePattern, LookFolderOptions, TargetBind, targetBind } from "../../index.js"
import * as pluginNpm from "./npm.js"

export const id = "yarn"
export const name = "Yarn"

/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
export const yarnPatternExclude = [
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
export const yarnPatternInclude = [
    'bin/',
    'package.json',
    'README',
    'README.*',
    'LICENSE',
    'LICENSE.*',
    'LICENCE',
    'LICENCE.*',
];

export const sources: Source[] = [
    { sources: new SourcePattern("**/package.json"), patternType: "minimatch", method: pluginNpm.methodPackageJsonFiles },
    { sources: new SourcePattern("**/.yarnignore"), patternType: ".*ignore", method: pluginNpm.methodGit },
    { sources: new SourcePattern("**/.npmignore"), patternType: ".*ignore", method: pluginNpm.methodGit },
    { sources: new SourcePattern("**/.gitignore"), patternType: ".*ignore", method: pluginNpm.methodGit },
]

export const scanOptions: LookFolderOptions = {
    ignore: yarnPatternExclude,
    addPatterns: yarnPatternInclude,
}

const bind: TargetBind = {id, name, sources, scanOptions}
targetBind(bind)
export default bind
