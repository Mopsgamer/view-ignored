import {
	join, parse, relative, type ParsedPath,
} from 'node:path';
import {File} from './file.js';

export class Directory implements ParsedPath {
	static from(pathList: Array<{toString(): string}>, cwd: string): Directory {
		const tree = new Directory(undefined, '.', cwd, []);

		for (const path of pathList) {
			const entryNameList = path.toString().split(/[\\/]/);
			// eslint-disable-next-line unicorn/no-array-reduce
			entryNameList.reduce((tree, entryName, index) => {
				const absolutePath = join(tree.absolutePath, entryName);
				const relativePath = relative(cwd, absolutePath);

				if (index === entryNameList.length - 1) {
					const file = new File(tree, relativePath, absolutePath);
					tree.children.push(file);
					return tree;
				}

				let directory = tree.children.find(
					c => c instanceof Directory && c.absolutePath === absolutePath,
				) as Directory | undefined;
				if (directory === undefined) {
					directory = new Directory(tree, relativePath, absolutePath, []);
					tree.children.push(directory);
				}

				return directory;
			}, tree);
		}

		return tree;
	}

	public readonly base: string;
	public readonly dir: string;
	public readonly ext: string;
	public readonly name: string;
	public readonly root: string;
	constructor(
		/**
         * The parent of the directory.
         */
		public readonly parent: Directory | undefined,

		/**
         * The relative path to the directory.
         */
		public readonly relativePath: string,

		/**
		 * The absolute path to the file.
		 */
		public readonly absolutePath: string,

		/**
         * The content of the directory.
         */
		public readonly children: Array<Directory | File>,
	) {
		const parsed = parse(absolutePath);
		this.base = parsed.base;
		this.dir = parsed.dir;
		this.ext = parsed.ext;
		this.name = parsed.name;
		this.root = parsed.root;
	}

	/**
	 * @returns The relative path to the directory.
	 */
	toString(): string {
		return this.relativePath;
	}

	flat(): File[] {
		const direntList = this.children.flatMap<File>(dirent => {
			if (dirent instanceof File) {
				return dirent;
			}

			return dirent.flat();
		});
		return direntList;
	}

	findRecursive<T extends Directory | File = Directory | File>(callback: (dirent: Directory | File) => boolean): T | undefined {
		const directoryChildrens: Directory[] = [];
		const found = this.children.find(dirent => {
			if (dirent instanceof Directory) {
				directoryChildrens.push(dirent);
			}

			return callback(dirent);
		}) as T | undefined;
		if (found !== undefined) {
			return found;
		}

		for (const directory of directoryChildrens) {
			const found = directory.findRecursive<T>(callback);
			if (found === undefined) {
				continue;
			}

			return found;
		}
	}
}
