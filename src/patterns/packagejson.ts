import { type } from "arktype";
import {
  sourcePushNegatable,
  type Source,
  type SourceExtractor,
  type SourceExtractorResult,
} from "./matcher.js";

const nodeJsManifest = type({
  files: "string[]?",
});

const parse = type("string")
  .pipe((s) => JSON.parse(s))
  .pipe(nodeJsManifest);

export function extractPackageJson(
  source: Source,
  content: Buffer<ArrayBuffer>,
): SourceExtractorResult {
  source.inverted = true;
  const dist = parse(content.toString());
  if (dist instanceof type.errors) {
    return { errors: dist, extraction: "continue" };
  }

  if (!dist.files) {
    return;
  }

  for (const pattern of dist.files) {
    sourcePushNegatable(source, pattern);
  }

  return;
}

extractPackageJson satisfies SourceExtractor;
