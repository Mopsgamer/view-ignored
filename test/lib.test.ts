import * as viewig from "../src/index.js"
import mock from "mock-fs"
import assert from "assert"
import type FileSystem from "mock-fs/lib/filesystem.js"
import { pathToFileURL } from "url"

interface Case {
    shouldInclude: string[]
    content: FileSystem.DirectoryItem
}
type DirCase = Record<string, Case>
type Plan = Record<string, DirCase>

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

    /**
     * @todo Add tests.
     */
    yarn: {
        'empty project': {
            shouldInclude: [],
            content: {},
        },
    },

    /**
     * @todo Add tests.
     */
    vsce: {
        'empty project': {
            shouldInclude: [],
            content: {},
        },
    },
} as Plan

const testPath = './test/.simulation'

async function testTarget(id: string, test: Case) {
    mock({ [pathToFileURL(testPath).toString()]: test.content })
    const lookList = await viewig.scanProject(id, { cwd: testPath, filter: 'included' })

    if (!lookList) return;

    const sourcesView = JSON.stringify(test.content, null, ' '.repeat(2))

    assert.deepEqual(
        lookList.map(l => l.filePath).sort(),
        test.shouldInclude.sort(),
        `Bad paths results.\n\n${sourcesView}`
    )
}

describe("Targets", function () {
    before(async () => {await viewig.Plugins.BuiltIns})
    for (const targetId in targetTestList) {
        describe(targetId, function () {
            const tests = targetTestList[targetId]
            for (const testName in tests) {
                it(testName, async function () {
                    const test = tests[testName]
                    await testTarget(targetId, test)
                })
            }
        })
    }
})

mock.restore()
