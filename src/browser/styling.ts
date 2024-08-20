import path from 'node:path';
import {stripVTControlCharacters} from 'node:util';
import tree from 'treeify';
import jsonifyPaths from 'jsonify-paths';
import {type ChalkInstance} from 'chalk';
import boxen, {type Options} from 'boxen';
import {type FileInfo} from '../index.js';

export type FormatFilesOptions = {
	/**
	 * @default false
	 */
	showSources?: boolean;
	/**
	 * @default "paths"
	 */
	style: StyleName;
	/**
	 * @default "paths"
	 */
	decor?: DecorName;
	chalk: ChalkInstance;
};

/**
 * @returns Prints a readable file list. Here is '\n' ending.
 */
export function formatFiles(files: FileInfo[], options: FormatFilesOptions): string {
	const {showSources = false, chalk, decor = 'normal', style} = options ?? {};

	const isPaths = style === 'paths';
	const paths = files.map(f => f.toString({
		fileIcon: decor, usePrefix: true, chalk, source: showSources, entire: isPaths,
	}));

	if (isPaths) {
		return paths.join('\n') + '\n';
	}

	// IsTree
	const pathsAsObject = jsonifyPaths.from(paths, {delimiter: '/'});
	const pathsAsTree = tree.asTree(pathsAsObject, true, true);
	return pathsAsTree;
}

/**
 * Contains all style names.
 */
export const styleNameList = ['tree', 'paths'] as const;
/**
 * Contains all style names as a type.
 */
export type StyleName = typeof styleNameList[number];
/**
 * Checks if the value is the {@link StyleName}.
 */
export function isStyleName(value: unknown): value is StyleName {
	return typeof value === 'string' && styleNameList.includes(value as StyleName);
}

/**
 * Contains all decor names.
 */
export const decorNameList = ['normal', 'emoji', 'nerdfonts'] as const;
/**
 * Contains all decor names as a type.
 */
export type DecorName = typeof decorNameList[number];
/**
 * Checks if the value is the {@link DecorName}.
 */
export function isDecorName(value: unknown): value is DecorName {
	return typeof value === 'string' && decorNameList.includes(value as DecorName);
}

/**
 * Formatting options for the {@link decorCondition}.
 */
export type DecorConditionOptions = {
	/**
	 * @default ""
	 */
	prefix?: string;

	/**
	 * @default ""
	 */
	postfix?: string;

	/**
	 * If the decor is not an emoji or nerd use this string.
	 * @default ""
	 */
	ifNormal?: string;

	/**
	 * If style name (lowercase) contains `emoji` use this string.
	 * @default ""
	 */
	ifEmoji?: string;

	/**
	 * If style name (lowercase) contains `nerd` use this string.
	 * @default ""
	 */
	ifNerd?: string;
};

/**
 * Formats the string for specific style types.
 * @param decor The decor name.
 * @param condition Formatting options.
 */
export function decorCondition(decor: DecorName, condition: DecorConditionOptions): string {
	let result: string = condition.ifNormal ?? '';
	if (decor === 'emoji') {
		result = condition.ifEmoji ?? result;
	} else if (decor === 'nerdfonts') {
		result = condition.ifNerd ?? result;
	}

	if (result !== '') {
		result = (condition.prefix ?? '') + result + (condition.postfix ?? '');
	}

	return result;
}

export type BoxOptions = {
	noColor?: boolean;
} & Options;

export function boxError(message: string, options?: BoxOptions): string {
	let result = ('\n' + boxen(message, {
		titleAlignment: 'left',
		padding: {left: 2, right: 2},
		borderColor: 'redBright',
		borderStyle: 'round',
		...options,
	}));
	if (options?.noColor) {
		result = stripVTControlCharacters(result);
	}

	return result;
}

/**
 * Returns file icon for the file name & extension.
 * @param decor The decor name.
 * @param filePath The full file path.
 */
export function decorFile(decor: DecorName | undefined, filePath: string): string {
	const parsed = path.parse(filePath);
	let icon = '';
	switch (parsed.ext.toLocaleLowerCase()) {
		case '.js':
		case '.cjs':
		case '.mjs': {
			icon = '\uE60C';
			break;
		}

		case '.ts':
		case '.cts':
		case '.mts': {
			icon = '\uE628';
			break;
		}

		case '.styl': {
			icon = '\uE600';
			break;
		}

		case '.less': {
			icon = '\uE60B';
			break;
		}

		case '.scss':
		case '.sass': {
			icon = '\uE603';
			break;
		}

		case '.go': {
			icon = '\uE65E';
			break;
		}

		case '.json':
		case '.jsonc':
		case '.json5': {
			icon = '\uE60B';
			break;
		}

		case '.yml':
		case '.yaml': {
			icon = '\uE6A8';
			break;
		}

		case '.gitignore': {
			icon = '\uE65D';
			break;
		}

		case '.npmignore': {
			icon = '\uE616';
			break;
		}

		case '.dockerignore': {
			icon = '\uE650';
			break;
		}

		default: {
			icon = '\uE64E';
			break;
		}
	}

	switch (parsed.name.toLocaleLowerCase()) {
		case 'readme': {
			icon = '\uE66A';
			break;
		}

		case 'changelog': {
			icon = '\uE641';
			break;
		}

		case 'tsconfig': {
			icon = '\uE69D';
			break;
		}

		case 'eslint.config': {
			icon = '\uE655';
			break;
		}

		case 'stylelint.config': {
			icon = '\uE695';
			break;
		}

		default: {
			break;
		}
	}

	if (!decor) {
		return '';
	}

	return decorCondition(decor, {
		ifEmoji: '📄',
		ifNerd: icon,
		postfix: ' ',
	});
}
