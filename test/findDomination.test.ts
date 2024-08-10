import assert from "assert";
import { SourceInfo } from "../src/lib.js";

describe('SourceInfo.hierarcy farthest', function () {
    it('a, b', function () {
        assert.strictEqual(SourceInfo.hierarcy('file', ['a', 'b'], { closest: false }), 'a')
    })

    it('b, a', function () {
        assert.strictEqual(SourceInfo.hierarcy('file', ['b', 'a'], { closest: false }), 'a')
    })

    it('dir "file"', function () {
        assert.strictEqual(SourceInfo.hierarcy('file', ['file/a', 'a'], { closest: false }), 'a')
    })

    it('dir/a', function () {
        assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/a', 'dir/b', 'a'], { closest: false }), 'a')
    })

    it('dir/dir/a', function () {
        assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/dir/a', 'dir/a', 'a'], { closest: false }), 'a')
    })
})

describe('SourceInfo.hierarcy closest', function () {
    it('a, b', function () {
        assert.strictEqual(SourceInfo.hierarcy('file', ['a', 'b']), 'a')
    })

    it('b, a', function () {
        assert.strictEqual(SourceInfo.hierarcy('file', ['b', 'a']), 'a')
    })

    it('dir "file"', function () {
        assert.strictEqual(SourceInfo.hierarcy('file', ['file/a', 'a']), 'a')
    })

    it('dir/a', function () {
        assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/a', 'dir/b', 'a']), 'dir/a')
    })

    it('dir/dir/a', function () {
        assert.strictEqual(SourceInfo.hierarcy('dir/file', ['dir/dir/a', 'dir/a', 'a']), 'dir/a')
    })
})