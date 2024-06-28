import { execSync } from "child_process";

//#region git config reading
/**
 * Read git config value as string.
 */
export function gitCurrentBranch(cwd?: string): string | undefined {
	try {
		return execSync(`git rev-parse --abbrev-ref HEAD`, { cwd: cwd, }).toString().trim();
	} catch (error) {
		return;
	}
}
/**
 * Read git config value as string.
 */
export function gitConfigString(key: string, cwd?: string): string | undefined {
	try {
		return execSync(`git config ${key}`, { cwd: cwd, }).toString();
	} catch (error) {
		return;
	}
}
/**
 * Read git config value as boolean.
 */
export function gitConfigBool(key: string, cwd?: string): boolean | undefined {
	const str = gitConfigString(key, cwd)
	if (str === "true\n") {
		return true
	}
	if (str === "false\n") {
		return false
	}
}
//#endregion
