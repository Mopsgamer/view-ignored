import { Binding, Methodology } from "../index.js"
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

export const methodology: Methodology[] = [
    { pattern: "**/package.json", patternType: "minimatch", scan: pluginNpm.scanPackageJsonFiles, addPatterns: addPatternsInclude },
    { pattern: "**/.yarnignore", patternType: ".*ignore", scan: pluginNpm.scanGit, addPatterns: addPatternsExclude },
    { pattern: "**/.npmignore", patternType: ".*ignore", scan: pluginNpm.scanGit, addPatterns: addPatternsExclude },
    { pattern: "**/.gitignore", patternType: ".*ignore", scan: pluginNpm.scanGit, addPatterns: addPatternsExclude },
]

const bind: Binding.TargetBind = { id, name, methodology }
Binding.targetSet(bind)
export default bind
