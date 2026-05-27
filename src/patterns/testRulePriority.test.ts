import { expect, test, describe } from "bun:test"
import { ruleTestSync, RuleMatchKind } from "./rule.js"
import { ruleCompile } from "./resolveSources.js"

describe("rule priority", () => {
    test("external patterns override internal patterns (negation)", () => {
        const target: any = {
            internalRules: [
                ruleCompile({ pattern: ["ignored.txt"], excludes: true, compiled: null })
            ]
        }
        const source: any = {
            rules: [
                ruleCompile({ pattern: ["ignored.txt"], excludes: false, compiled: null })
            ],
            inverted: false
        }

        const match = ruleTestSync({
            target,
            resource: source,
            entry: "ignored.txt"
        })

        expect(match.kind).toBe(RuleMatchKind.external)
        expect(match.ignored).toBe(false)
    })

    test("internal patterns are applied if no external match", () => {
        const target: any = {
            internalRules: [
                ruleCompile({ pattern: ["internal.txt"], excludes: true, compiled: null })
            ]
        }
        const source: any = {
            rules: [],
            inverted: false
        }

        const match = ruleTestSync({
            target,
            resource: source,
            entry: "internal.txt"
        })

        expect(match.kind).toBe(RuleMatchKind.internal)
        expect(match.ignored).toBe(true)
    })
})
