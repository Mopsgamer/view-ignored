import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
	{ignores: ["lib/"]},
	{languageOptions: {globals: globals.node}},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
];