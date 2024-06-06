import mockfs from "mock-fs"
import * as viewig from "../src/index.js"
import assert from "assert"
import type FileSystem from "mock-fs/lib/filesystem.js"

interface TargetTest {
    target: viewig.TargetName
    tests: {
        name: string
        expect: string[]
        content: FileSystem.DirectoryItem
    }[]
}

const targetTestList: TargetTest[] = [
    {
        target: 'git',
        tests: [
            {
                name: 'empty project',
                expect: [],
                content: {},
            },
            {
                name: 'single file, no .gitignore',
                expect: ['file.txt'],
                content: {
                    'file.txt': ''
                },
            },
            {
                name: 'minimal project with .gitignore',
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
        ],
    },
    {
        target: 'npm',
        tests: [
            {
                name: 'empty project',
                expect: [],
                content: {},
            },
            {
                name: 'single file, no ignore sources',
                expect: ['file.txt'],
                content: {
                    'file.txt': ''
                },
            },
            {
                name: 'minimal project with .gitignore',
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
        ],
    },
    {
        target: 'yarn',
        tests: [
            {
                name: 'empty project',
                expect: [],
                content: {},
            },
        ],
    },
    {
        target: 'vscodeExtension',
        tests: [
            {
                name: 'empty project',
                expect: [],
                content: {},
            },
        ],
    },
]

describe("Targets", function () {
    for (const { target, tests } of targetTestList) {
        describe(target, function () {
            for (const test of tests) {
                it(test.name, function () {
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
