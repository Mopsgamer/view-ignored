import { ok } from "node:assert/strict";
import { test } from "node:test";
import { gitignoreMatch } from "./gitignore.js";

void test("gitignoreMatch", () => {
  ok(gitignoreMatch(".git", ".git/message"));
  ok(!gitignoreMatch(".git", ".github/message"));

  ok(gitignoreMatch("node_modules", "node_modules/x/message.ts"));
  ok(gitignoreMatch("message", ".git/message"));

  ok(gitignoreMatch("**/.git", ".git/message"));
  ok(!gitignoreMatch("**/.git", ".github/message"));

  ok(gitignoreMatch("/.git", ".git/message"));
  ok(!gitignoreMatch("/.git", ".github/message"));

  ok(!gitignoreMatch("/message", ".git/message"));
  ok(!gitignoreMatch("/message", ".git/message/file"));
  ok(gitignoreMatch("/message", "message"));
  ok(gitignoreMatch("/message", "message/file"));

  ok(gitignoreMatch(".git/", ".git/message"));
  ok(gitignoreMatch(".git/", ".git/message/file"));
  ok(gitignoreMatch(".git/", ".git"));
  ok(!gitignoreMatch(".git/", ".github/message"));
  ok(!gitignoreMatch(".git/", ".github/message/file"));
  ok(!gitignoreMatch(".git/", ".github"));
});
