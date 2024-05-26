import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import "eslint-plugin-only-warn";

export default [
	{ignores: ["lib/"]},
	{languageOptions: {globals: globals.node}},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
];