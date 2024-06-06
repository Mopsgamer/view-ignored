import mock from "mock-fs"
import * as viewig from "../src/index.js"
import assert from "assert"

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
    const lookList = viewig.lookProjectDirSync({ cwd: './test-proj', ...viewig.Presets.git })
    assert.deepEqual(lookList.map(l=>l.filePath), ['hello', '.gitignore'])
    mock.restore()
})