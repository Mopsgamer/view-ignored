import { type } from "arktype";
import type { Source, SourceExtractor, SourceExtractorResult } from "./matcher.js";
import stripJsonComments from "strip-json-comments";

const jsrManifest = type({
  exclude: "string[]?",
  include: "string[]?",
  publish: {
    exclude: "string[]?",
    include: "string[]?",
  },
});

const parse = jsrManifest.pipe((s: string): typeof jsrManifest.infer => JSON.parse(s));

export function extractJsrJson(
  source: Source,
  content: Buffer<ArrayBuffer>,
): SourceExtractorResult {
  const dist = parse(content.toString());
  if (dist instanceof type.errors) {
    return { errors: dist, extraction: "stop" };
  }

  if (!dist.publish) {
    if (dist.exclude) {
      source.pattern.exclude.push(...dist.exclude);
    }
  } else if (dist.publish.exclude) {
    source.pattern.exclude.push(...dist.publish.exclude);
  }

  if (!dist.publish) {
    if (dist.include) {
      source.pattern.include.push(...dist.include);
    }
  } else if (dist.publish.include) {
    source.pattern.include.push(...dist.publish.include);
  }

  return;
}

extractJsrJson satisfies SourceExtractor;

export function extractJsrJsonc(
  source: Source,
  content: Buffer<ArrayBuffer>,
): SourceExtractorResult {
  return extractJsrJson(source, Buffer.from(stripJsonComments(content.toString())));
}

extractJsrJsonc satisfies SourceExtractor;
