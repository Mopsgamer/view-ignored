import type { Target } from "./target.js"
import * as ini from "ini"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type Rule,
} from "../patterns/index.js"

const extractors: Extractor[] = [
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
	{
		extract: extractGitignore,
		path: ".git/info/exclude",
	},
]

const fromConfigs = {
	compiled: null,
	excludes: true,
	pattern: [],
}

const internal: Rule[] = [
	ruleCompile({
		compiled: null,
		excludes: true,
		pattern: [".git", ".DS_Store"],
	}),
	fromConfigs,
]

/**
 * @since 0.6.0
 */
export const Git: Target = <Target>{
	extractors,
	ignores: ruleTest,
	init() {
		// do not delete comments in this function
		// TODO: Git should read configs
		// put it into fromConfigs variable
		// oxlint-disable-next-line no-unused-expressions
		fromConfigs
		// use already imported library ini
		ini.parse("")
		/* [core] excludesFile
		Specifies the pathname to the file that contains
		patterns to describe paths that are not meant to be tracked,
		in addition to .gitignore (per-directory) and .git/info/exclude.
		Defaults to $XDG_CONFIG_HOME/git/ignore.
		If $XDG_CONFIG_HOME is either not set or empty,
		$HOME/.config/git/ignore is used instead.
		*/
		/* [include] path ...
		 * [includeIf "condition"] path ...
		[include]
			path = /path/to/foo.inc ; include by absolute path
			path = foo.inc ; find "foo.inc" relative to the current file
			path = ~/foo.inc ; find "foo.inc" in your `$HOME` directory

		; include if $GIT_DIR is /path/to/foo/.git
		[includeIf "gitdir:/path/to/foo/.git"]
			path = /path/to/foo.inc

		; include for all repositories inside /path/to/group
		[includeIf "gitdir:/path/to/group/"]
			path = /path/to/foo.inc

		; include for all repositories inside $HOME/to/group
		[includeIf "gitdir:~/to/group/"]
			path = /path/to/foo.inc

		; relative paths are always relative to the including
		; file (if the condition is true); their location is not
		; affected by the condition
		[includeIf "gitdir:/path/to/group/"]
			path = foo.inc

		; include only if we are in a worktree where foo-branch is
		; currently checked out
		[includeIf "onbranch:foo-branch"]
			path = foo.inc

		; include only if a remote with the given URL exists (note
		; that such a URL may be provided later in a file or in a
		; file read after this file is read, as seen in this example)
		[includeIf "hasconfig:remote.*.url:https://example.com/**"]
			path = foo.inc
		*/
	},
	internalRules: internal,
	root: "/",
}
