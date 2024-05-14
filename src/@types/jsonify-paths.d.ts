declare module "jsonify-paths" {
	interface Tree {
		[key: string]: string | Tree
	}
	const defaults: {
		options: Options
	}
	interface Options {
		delimiter?: string,
		ignoreSpacesAroundDelimiters?: boolean,
		defaultValue?: unknown
	}
	function from(paths: string | string[], options?: Options): Record<string, Tree>
}