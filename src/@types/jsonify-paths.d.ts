declare module 'jsonify-paths' {
  type Tree = {
    [key: string]: string | Tree
  }
  const defaults: {
    options: Options
  }
  type Options = {
    delimiter?: string
    ignoreSpacesAroundDelimiters?: boolean
    defaultValue?: unknown
  }
  function from(
    paths: string | string[],
    options?: Options,
  ): Record<string, Tree>
}
