import { FileTree, createFixture } from "fs-fixture"
import * as viewig from "../src/index.js"
import assert from "assert"
import { readFileSync } from "fs"
import chalk from "chalk"

interface Case {
    should: typeof viewig.SomeError | {
        include: string[]
        source: string
    }
    content: FileTree
}

type DirCase = Record<string, Case>
type Plan = Record<string, DirCase>

const realProject = {
    '.github': {},
    'bin/app': '',
    'node_modules/tempdep/indexOf.js': '',
    'lib/cli.js': '',
    'lib/index.js': '',
    'test/app.test.js': '',
    'README.md': '',
    'config.json': '',
}

const targetTestList: Plan = {
    git: {
        'empty project': {
            should: viewig.ErrorNoSources,
            content: {},
        },
        'single file': {
            should: viewig.ErrorNoSources,
            content: {
                'file.txt': ''
            },
        },
        '.gitignore': {
            should: {
                include: [
                    'file.txt',
                    '.gitignore',
                ],
                source: '.gitignore'
            },
            content: {
                'file.txt': '',
                'node_modules/tempdep/indexOf.js': '',
                '.gitignore': 'node_modules',
            },
        },
    },

    /**
     * @see {@link npmPatternExclude} {@link npmPatternInclude}
     */
    npm: {
        'empty project': {
            should: viewig.ErrorNoSources,
            content: {},
        },
        'single file': {
            should: viewig.ErrorNoSources,
            content: {
                'file.txt': '',
            },
        },
        '.gitignore': {
            should: {
                include: ['file.txt'],
                source: '.gitignore',
            },
            content: {
                'file.txt': '',
                'node_modules/tempdep/indexOf.js': '',
                '.gitignore': 'node_modules',
            },
        },
        'real project: (package.json), .npmignore, .gitignore': {
            should: {
                include: [
                    'README.md',
                    'bin/app',
                    'package.json',
                ],
                source: 'package.json',
            },
            content: {
                ...realProject,
                '.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
                '.gitignore': 'node_modules\nconfig.json',
                'package.json': JSON.stringify({
                    files: [],
                    main: './lib/index.js',
                    name: 'app',
                    version: '0.0.1',
                }),
            },
        },
        'real project: package.json, (.npmignore), .gitignore': {
            should: {
                include: [
                    'README.md',
                    'bin/app',
                    'lib/cli.js',
                    'lib/index.js',
                    'package.json'
                ],
                source: '.npmignore',
            },
            content: {
                ...realProject,
                '.npmignore': 'node_modules\nconfig*.json\ntest\n.github',
                '.gitignore': 'node_modules\nconfig.json',
                'package.json': JSON.stringify({
                    main: './lib/index.js',
                    name: 'app',
                    version: '0.0.1',
                }),
            },
        },
    },

    /**
     * @todo Add tests.
     */
    yarn: {
        'empty project': {
            should: viewig.ErrorNoSources,
            content: {},
        },
    },

    /**
     * @todo Add tests.
     */
    vsce: {
        'empty project': {
            should: viewig.ErrorNoSources,
            content: {},
        },
    },
}

function lineInfo(line: number, name?: string) {
    return `${chalk.cyan('./test/targets.test.ts')}${chalk.white(':')}${chalk.yellow(line)}${name ? `\t- ${name}` : ''}`
}

describe("Targets", function () {
    const myContent = readFileSync('./test/targets.test.ts').toString()
    const myContentLines = myContent.split('\n')
    before(async () => { await viewig.Plugins.BuiltIns })
    for (const targetId in targetTestList) {
        describe(targetId, function () {
            const tests = targetTestList[targetId]
            for (const testName in tests) {
                it(testName, async function () {
                    const test = tests[testName]
                    const { should, content } = test

                    const fixture = await createFixture(content)
                    const lookListPromise = viewig.scanProject(targetId, { cwd: fixture.getPath(), filter: 'included' })
                    lookListPromise.then(() => fixture.rm())

                    if (typeof should !== "object") {
                        try {
                            await lookListPromise
                            assert.throws(async () => { await lookListPromise })
                        } catch (exc) {
                            assert(exc instanceof should, "Bad SomeError prototype.")
                        }
                        return;
                    }

                    const cmp1 = (await lookListPromise).map(l => l.toString()).sort()
                    const cmp2 = should.include.sort()
                    const testLine = myContentLines.findIndex(ln => ln.includes(testName)) + 1
                    const testLineContent = testLine + myContentLines.slice(testLine).findIndex(ln => ln.includes('content')) + 1
                    const actual = (await lookListPromise)
                        .map(l => {
                            const testLineSource = testLineContent + myContentLines.slice(testLineContent).findIndex(ln => ln.includes(l.source.sourcePath)) + 1
                            return chalk.red(l.toString({ source: true, chalk })) + ' ' + lineInfo(testLineSource)
                        })
                        .sort().join('\n        ');
                    const info = `\n      Test location: ${lineInfo(testLine)}\n      Test name: ${chalk.magenta(testName)}\n      Results: \n        ${actual}\n`
                    for (const fileInfo of (await lookListPromise)) {
                        assert.strictEqual(fileInfo.source.sourcePath, should.source, 'The source is not right.' + chalk.white(info))
                    }
                    assert.deepEqual(cmp1, cmp2, 'The path list is bad.' + chalk.white(info))
                })
            }
        })
    }
})
