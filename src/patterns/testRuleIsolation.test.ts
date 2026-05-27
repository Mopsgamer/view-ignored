import { expect, test, describe } from "bun:test"
import { ruleTestSync, RuleMatchKind } from "./rule.js"
import { ruleCompile } from "./resolveSources.js"

describe("rule isolation regression", () => {
    test("same pattern string in different sources with different results", () => {
        const target: any = { internalRules: [] }

        // Source 1: pattern "foo" excludes
        const source1: any = {
            rules: [
                ruleCompile({ pattern: ["foo"], excludes: true, compiled: null })
            ],
            inverted: false
        }

        // Source 2: pattern "foo" includes (negation)
        const source2: any = {
            rules: [
                ruleCompile({ pattern: ["foo"], excludes: false, compiled: null })
            ],
            inverted: false
        }

        const match1 = ruleTestSync({
            target,
            resource: source1,
            entry: "foo"
        })

        const match2 = ruleTestSync({
            target,
            resource: source2,
            entry: "foo"
        })

        expect(match1.ignored).toBe(true)
        expect(match1.source).toBe(source1)

        expect(match2.ignored).toBe(false)
        expect(match2.source).toBe(source2)
    })
})
