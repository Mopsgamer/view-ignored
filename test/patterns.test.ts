import assert from "assert"
import * as viewig from "../src/index.js"

describe('Patterns', function () {
    const testList: Record<viewig.PatternType, [pattern: string, str: string, shouldMatch?: boolean][]> = {
        'gitignore': [
            ['file', 'file'],
            ['dir', 'dir/file'],
            ['dir/**', 'dir/file'],
        ],
        'minimatch': [
            ['file', 'file'],
            ['dir', 'dir/file'],
            ['dir/**', 'dir/file'],
        ]
    }

    for (const patternType in testList) {
        describe(patternType, function () {
            for (const [pattern, str, shouldMatch] of testList[patternType as viewig.PatternType]) {
                it(`'${str}'${shouldMatch === false ? ' not' : ''} matches the pattern '${pattern}'`, function () {
                    assert.strictEqual(new viewig.Scanner({ patternType: 'gitignore' }).add(pattern).matches(str), shouldMatch ?? true, `The pattern '${pattern}' not satisfied by the string '${str}'`)
                })
            }
        })
    }
})