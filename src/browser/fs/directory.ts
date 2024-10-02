import {
	join, parse, relative, type ParsedPath,
} from 'node:path';
import {File} from './file.js';

export class Directory implements ParsedPath {
	public readonly base: string;
	public readonly dir: string;
	public readonly ext: string;
	public readonly name: string;
	public readonly root: string;
	constructor(
		/**
         * The relative path to the directory.
         */
		public readonly relativePath: string,

		/**
		 * The absolute path to the file.
		 */
		public readonly absolutePath: string,
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
}

export class DirectoryTree extends Directory {
	static from(pathList: Array<{toString(): string}>, cwd: string): DirectoryTree {
		const tree = new DirectoryTree('.', cwd, []);

		for (const path of pathList) {
			const entryNameList = path.toString().split(/[\\/]/);
			// eslint-disable-next-line unicorn/no-array-reduce
			entryNameList.reduce((tree, entryName, index) => {
				const absolutePath = join(tree.absolutePath, entryName);
				const relativePath = relative(cwd, absolutePath);

				if (index === entryNameList.length - 1) {
					const file = new File(relativePath, absolutePath);
					tree.children.push(file);
					return tree;
				}

				let directory = tree.children.find(
					c => c instanceof DirectoryTree && c.absolutePath === absolutePath,
				) as DirectoryTree | undefined;
				if (directory === undefined) {
					directory = new DirectoryTree(relativePath, absolutePath, []);
					tree.children.push(directory);
				}

				return directory;
			}, tree);
		}

		return tree;
	}

	constructor(
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
		public readonly children: Array<DirectoryTree | File>,
	) {
		super(relativePath, absolutePath);
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
}
