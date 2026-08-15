export type { Target } from "./targets/target.js"
export type {
	GlobRule,
	CustomRule,
	SkipRule,
	Rule,
	InternalRules,
	RuleMatch,
	RuleTestOptions,
	IgnoresOptions,
} from "./patterns/rule.js"
export { RuleMatchKind, ruleTest, ruleTestSync, isRuleMatchInvalid } from "./patterns/rule.js"
export { ruleCompile } from "./patterns/resolveSources.js"

export type { Extractor } from "./patterns/extractor.js"
export { extractGitignore, extractGitignoreRules } from "./patterns/gitignore.js"
export { extractNpmignore, extractNpmignoreRules } from "./patterns/npmignore.js"
export { packageJsonExtractor, makePackageJsonExtractor } from "./patterns/packagejson.js"
export { extractJsrJson, extractJsrJsonRules } from "./patterns/jsrjson.js"

export type { Source } from "./patterns/source.js"
export type { Resource } from "./patterns/resource.js"
export type { PatternList } from "./patterns/patternList.js"

export { unixify, join, dirname, strip, trimLeadingDotSlash, isWhitespace } from "./unixify.js"

export type { NpmContext, PackageJson } from "./targets/npmManifest.js"
export {
	createNpmContext,
	initNpmContext,
	makeBundledDepsRule,
	makePackageResolutionRule,
	symlinkRule,
	makePatchedDepsRule,
	makeDirectPathsRule,
	extractNoCaseNpmignore,
	npmManifestParse,
	extractManifestIncludes,
	findDependencyPackageJson,
	resolveBundledDeps,
} from "./targets/npmManifest.js"

export { makeJsrInit } from "./targets/jsrManifest.js"
export { vsceManifestParse } from "./targets/vsceManifest.js"
export {
	HOME,
	XDG,
	resolvePath,
	loadRec,
	mergeConfig,
	getCache,
	parseGit,
	getIncludes,
} from "./targets/gitConfig.js"
