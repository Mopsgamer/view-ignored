declare module "properties" {
    type ParseOptions = unknown
    type StringifyOptions = unknown
    function parse(data: string, options?: ParseOptions, callback?: () => void): undefined | Record<string, string>
    function stringify(obj: Record<string, string>, options?: StringifyOptions, callback?: () => void) : undefined | string
}