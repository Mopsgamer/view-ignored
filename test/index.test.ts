import assert from "node:assert";
import {it} from "mocha";
import {gitConfigBool} from "../src"

it("git config reading", function() {
	assert(gitConfigBool('core.ignoreCase') === true)
	assert(gitConfigBool('core.symlinks') === false)
})