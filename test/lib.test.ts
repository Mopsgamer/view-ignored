import mockfs from "mock-fs"
import * as viewig from "../src/index.js"
import assert from "assert"
import type FileSystem from "mock-fs/lib/filesystem.js"
import { npmPatternExclude, npmPatternInclude } from "../src/index.js"

interface Case {
    expect: string[]
    content: FileSystem.DirectoryItem
}
type DirCase = Record<string, Case>
type Plan = Record<viewig.TargetName, DirCase>

const targetTestList = {
    git: {
        'empty project': {
            expect: [],
            content: {},
        },
        'single file, no .gitignore': {
            expect: ['file.txt'],
            content: {
                'file.txt': ''
            },
        },
        'minimal project: .gitignore': {
            expect: ['file.txt', '.gitignore'],
            content: {
                'file.txt': '',
                'node_modules': {
                    'tempdep': {
                        'indexOf.js': ''
                    }
                },
                '.gitignore': 'node_modules'
            },
        },
    },
    /**
     * @see {@link npmPatternExclude} {@link npmPatternInclude}
     */
    npm: {
        'empty project': {
            expect: [],
            content: {},
        },
        'single file, no ignore sources': {
            expect: ['file.txt'],
            content: {
                'file.txt': ''
            },
        },
        'minimal project: .gitignore': {
            expect: ['file.txt'],
            content: {
                'file.txt': '',
                'node_modules': {
                    'tempdep': {
                        'indexOf.js': ''
                    }
                },
                '.gitignore': 'node_modules'
            },
        },
        'minimal project: .npmignore, .gitignore': {
            expect: ['file2.txt'],
            content: {
                'file.txt': '',
                'file2.txt': '',
                'node_modules': {
                    'tempdep': {
                        'indexOf.js': ''
                    }
                },
                '.npmignore': 'file.txt',
                '.gitignore': 'file2.txt'
            },
        },
    },
    yarn: {
        'empty project': {
            expect: [],
            content: {},
        },
    },
    vscodeExtension: {
        'empty project': {
            expect: [],
            content: {},
        },
    },
} as const satisfies Plan

describe("Targets", function () {
    for (const target in targetTestList) {
        describe(target, function () {
            const tests = targetTestList[target] as DirCase
            for (const testName in tests) {
                it(testName, function () {
                    const test = tests[testName] as Case
                    const testPath = './test/simulation'
                    mockfs({ [testPath]: test.content })
                    const lookList = viewig.lookProjectDirSync({ cwd: testPath, ...viewig.Presets[target] })
                    assert.deepEqual(lookList.map(l => l.filePath).sort(), test.expect.sort())
                    mockfs.restore()
                })
            }
        })
    }
})
