import mock from "mock-fs"
import * as viewig from "../src/index.js"
import assert from "assert"
import chalk from "chalk"

it("should work", function () {
    mock({
        './test-proj': {
            'hello': '',
            'node_modules': {
                'tempdep': {
                    'indexOf.js': ''
                }
            },
            '.gitignore': 'node_modules'
        }
    })
    const lookList = viewig.lookProjectSync({ cwd: './test-proj', ...viewig.GetPresets("paths", chalk).git })
    assert.deepEqual(lookList.map(l=>l.path).sort(), ['hello', '.gitignore'].sort())
    mock.restore()
})