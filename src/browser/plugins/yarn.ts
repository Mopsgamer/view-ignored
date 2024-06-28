import { Source, SourcePattern, TargetBind, targetBind } from "../../index.js"
import * as pluginNpm from "./npm.js"

export const id = "yarn"
export const name = "Yarn"

/**
 * [!WARNING] All patterns copied from npm plugin, so they should be verified with yarn docs.
 */
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

export const sources: Source[] = [
    { sources: new SourcePattern("**/package.json"), patternType: "minimatch", method: pluginNpm.methodPackageJsonFiles, addPatterns: addPatternsInclude },
    { sources: new SourcePattern("**/.yarnignore"), patternType: ".*ignore", method: pluginNpm.methodGit, addPatterns: addPatternsExclude },
    { sources: new SourcePattern("**/.npmignore"), patternType: ".*ignore", method: pluginNpm.methodGit, addPatterns: addPatternsExclude },
    { sources: new SourcePattern("**/.gitignore"), patternType: ".*ignore", method: pluginNpm.methodGit, addPatterns: addPatternsExclude },
]

const bind: TargetBind = {id, name, sources}
targetBind(bind)
export default bind
