import { execSync } from "child_process";

/**
 * Read git config value as string.
 */
export function CurrentBranch(cwd?: string): string | undefined {
	try {
		return execSync(`git rev-parse --abbrev-ref HEAD`, { cwd: cwd, }).toString().trim();
	} catch (error) {
		return;
	}
}
/**
 * Read git config value as string.
 */
export function String(key: string, cwd?: string): string | undefined {
	try {
		return execSync(`git config ${key}`, { cwd: cwd, }).toString();
	} catch (error) {
		return;
	}
}
/**
 * Read git config value as boolean.
 */
export function Boolean(key: string, cwd?: string): boolean | undefined {
	const str = String(key, cwd)?.trim()
	if (str === "true") {
		return true
	}
	if (str === "false") {
		return false
	}
}