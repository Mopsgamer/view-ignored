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
        'real project: .npmignore, .gitignore, package.json no "files" prop': {
            shouldInclude: ['README.md', 'bin/app', 'lib/cli.js', 'lib/index.js', 'packagee.json'],
            content: {
                '.github': {},
                'bin': {
                    'app': ''
                },
                'node_modules': {
                    'tempdep': {
                        'indexOf.js': ''
                    }
                },
                'lib': {
                    'cli.js': '',
                    'index.js': ''
                },
                'test': {
                    'app.test.js': ''
                },
                'README.md': '',
                'config.json': '',
                '.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
                '.gitignore': 'node_modules\nconfig.json',
                'package.json': JSON.stringify({
                    main: './lib/index.js',
                    name: 'app',
                    version: '0.0.1'
                })
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

describe("Targets", function () {
    before(async () => { await viewig.Plugins.BuiltIns })
    for (const targetId in targetTestList) {
        describe(targetId, function () {
            const tests = targetTestList[targetId]
            for (const testName in tests) {
                it(testName, async function () {
                    const test = tests[testName]
                    mock({ [pathToFileURL(testPath).toString()]: test.content })
                    const lookList = await viewig.scanProject(targetId, { cwd: testPath, filter: 'included' })

                    assert(lookList !== undefined, "lookList should be an array")

                    const sourcesView = JSON.stringify(test.content, null, ' '.repeat(2))

                    const cmp1 = lookList.map(l => l.filePath).sort()
                    const cmp2 = test.shouldInclude.sort()
                    assert.deepEqual(
                        cmp1,
                        cmp2,
                        `Bad paths results.\n\n${sourcesView}`
                    )
                })
            }
        })
    }
})

mock.restore()
