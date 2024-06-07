import mockfs from "mock-fs"
import * as viewig from "../src/index.js"
import assert from "assert"
import type FileSystem from "mock-fs/lib/filesystem.js"
import { Util } from "../src/index.js"

interface Case {
    shouldInclude: string[]
    content: FileSystem.DirectoryItem
}
type DirCase = Record<string, Case>
type Plan = Record<viewig.TargetName, DirCase>

const targetTestList = {
    git: {
        'empty project': {
            shouldInclude: [],
            content: {},
        },
        'single file, no .gitignore': {
            shouldInclude: ['file.txt'],
            content: {
                'file.txt': ''
            },
        },
        'minimal project: .gitignore': {
            shouldInclude: ['file.txt', '.gitignore'],
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
            shouldInclude: [],
            content: {},
        },
        'empty project node_modules only': {
            shouldInclude: [],
            content: {
                'node_modules': {}
            },
        },
        'single file, no ignore sources': {
            shouldInclude: ['file.txt'],
            content: {
                'file.txt': ''
            },
        },
        'minimal project: .gitignore': {
            shouldInclude: ['file.txt'],
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
            shouldInclude: ['file2.txt'],
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
        'minimal project: package.json, .npmignore, .gitignore': {
            shouldInclude: ['file2.txt', 'package.json'],
            content: {
                'file.txt': '',
                'file2.txt': '',
                'node_modules': {
                    'tempdep': {
                        'indexOf.js': ''
                    }
                },
                '.npmignore': 'file.txt',
                '.gitignore': 'file2.txt',
                'package.json': JSON.stringify({
                    files: ['file2.txt']
                })
            },
        },
        'minimal project: .npmignore, .gitignore, "{}" package.json': {
            shouldInclude: ['file2.txt', 'package.json'],
            content: {
                'file.txt': '',
                'file2.txt': '',
                'node_modules': {
                    'tempdep': {
                        'indexOf.js': ''
                    }
                },
                '.npmignore': 'file.txt',
                '.gitignore': 'file2.txt',
                'package.json': '{}'
            },
        },
        'minimal project: .npmignore, .gitignore, "" package.json': {
            shouldInclude: ['file2.txt', 'package.json'],
            content: {
                'file.txt': '',
                'file2.txt': '',
                'node_modules': {
                    'tempdep': {
                        'indexOf.js': ''
                    }
                },
                '.npmignore': 'file.txt',
                '.gitignore': 'file2.txt',
                'package.json': ''
            },
        },
    },
    yarn: {
        'empty project': {
            shouldInclude: [],
            content: {},
        },
    },
    vscodeExtension: {
        'empty project': {
            shouldInclude: [],
            content: {},
        },
    },
} as const satisfies Plan

const testPath = './test/.simulation'
describe("Targets", function () {
    for (const target in targetTestList) {
        describe(target, function () {
            const tests = targetTestList[target] as DirCase
            for (const testName in tests) {
                const test = tests[testName] as Case
                it(testName, function () {
                    mockfs({ [testPath]: test.content })
                    const lookList = viewig.lookProjectDirSync({ cwd: testPath, filter: 'included', ...viewig.Util.Presets[target] })
                    assert.deepEqual(lookList.map(l => l.filePath).sort(), test.shouldInclude.sort())
                })
            }
        })
    }
})
mockfs.restore()
