import {
  type SourceExtractor,
  type SignedPattern,
  signedPatternIgnores,
} from "../patterns/matcher.js";
import { extractGitignore } from "../patterns/gitignore.js";
import type { Target } from "./target.js";

const gitSources = [".gitignore"];
const gitSourceMap = new Map<string, SourceExtractor>([[".gitignore", extractGitignore]]);
const gitPattern: SignedPattern = {
  exclude: [".git", ".DS_Store"],
  include: [],
};

export const Git: Target = {
  async ignores(cwd, entry, ctx) {
    return await signedPatternIgnores(gitPattern, cwd, entry, gitSources, gitSourceMap, ctx);
  },
};
