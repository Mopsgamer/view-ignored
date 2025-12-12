import type { TargetContext, SourceMap } from './scan.js';
import * as fsp from 'node:fs/promises';
import { dirname } from 'node:path';

export async function findAndExtract(directory: string, sources: string[], matcher: SourceMap, result: TargetContext): void {
  const keys: string[] = []
  result.sourceErrors = []
  for (const source of sources) {
    for (;;) {
      let notExists = false
      try {
        const buff = await fsp.readFile(directory + '/' + source)
      }
      catch (err) {
        const error = err as NodeJS.ErrnoException
        if (error.code === 'ENOENT') {
          notExists = true
        } else {
          result.sourceErrors.push(error)
          return
        }
      }

      const dir = dirname(directory)
      if (!result.external.has(directory)) {
        keys.push(directory)
        return
      }

      const ex = result.external.get(source)
      if (ex === undefined) {
        keys.push(directory)
      }
      if (notExists) {
        if (directory === '.') {
          break
        }
        directory = dir
        continue
      }
      
      if (directory === '.' && keys.length === 0) {
        break
      }

      const extractor = matcher.get(source)!
      const mtch = extractor(source, buff)
    }
  }
}
/**
 * func FindAndExtract(directory string, sources []string, matcher map[string]SourceExtractor, ctx *MatcherContext) {
	keys := []string{}
	ctx.SourceErrors = []error{}
	for source := range slices.Values(sources) {
		for {
			bytes, err := os.ReadFile(directory + "/" + source)
			if err != nil && !os.IsNotExist(err) {
				ctx.SourceErrors = append(ctx.SourceErrors, err)
				return
			}

			dir := path.Dir(directory)
			_, exists := ctx.External[directory]
			if !exists {
				keys = append(keys, directory)
			}
			if os.IsNotExist(err) {
				if directory == "." {
					break
				}
				directory = dir
				continue
			}

			if directory == "." && len(keys) == 0 {
				break
			}

			extractor := matcher[source]
			include, exclude, def, err := extractor(source, bytes)
			if err != nil {
				ctx.SourceErrors = append(ctx.SourceErrors, err)
				break
			}
			for _, key := range keys {
				m, ok := ctx.External[key]
				if !ok {
					m = Source{}
				}
				m.Exclude = append(m.Exclude, exclude...)
				m.Include = append(m.Include, include...)
				m.Inverted = def
				m.Name = source
				ctx.External[key] = m
			}
			if directory == "." {
				return
			}
			keys = []string{}
			directory = dir
		}
	}
}
 */