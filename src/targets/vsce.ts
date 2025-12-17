import {
  type SourceExtractor,
  type SignedPattern,
  signedPatternIgnores,
} from "../patterns/matcher.js";
import { extractGitignore } from "../patterns/gitignore.js";
import { extractPackageJson } from "../patterns/packagejson.js";
import type { Target } from "./target.js";

const vsceSources = ["package.json", ".vscodeignore"];
const vsceSourceMap = new Map<string, SourceExtractor>([
  ["package.json", extractPackageJson],
  [".vscodeignore", extractGitignore],
  [".gitignore", extractGitignore],
]);
const vscePattern: SignedPattern = {
  exclude: [".git", ".DS_Store"],
  include: [],
};

export const VSCE: Target = {
  async ignores(cwd, entry, ctx) {
    return await signedPatternIgnores(vscePattern, cwd, entry, vsceSources, vsceSourceMap, ctx);
  },
};
