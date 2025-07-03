import ansiRegex from 'ansi-regex'
import { type ChalkInstance } from 'chalk'

export * from './browser/styling.js'

export function highlight(text: string, chalk?: ChalkInstance): string {
  if (chalk === undefined) {
    return text
  }

  const rtype = /^(?<=\s*)(switch|boolean|object|string|number|integer)(\[])*(?=\s*)$/
  if (rtype.test(text)) {
    return chalk.hex('#9999ff')(text)
  }

  const rseparator = /([,.\-:="|])/g
  const rstring = /'[^']+'/g
  const rbracketsSquare = /(\[|])/g
  const rnumber = /\d+/g
  const rspecial = /(true|false|null|Infinity)/g

  const rall = new RegExp(`${
    [ansiRegex(), rstring, rseparator, rbracketsSquare, rnumber, rspecial]
      .map(r => `(${typeof r === 'string' ? r : r.source})`)
      .join('|')
  }`, 'g')

  const colored = text.replaceAll(rall, (match) => {
    if (match.match(ansiRegex()) !== null) {
      return match
    }

    if (match.match(rstring) !== null) {
      return match.replace(/^'[^']*'$/, chalk.hex('#A2D2FF')('$&'))
    }

    if (match.match(rseparator) !== null) {
      return chalk.hex('#D81159')(match)
    }

    if (match.match(rbracketsSquare) !== null) {
      return chalk.hex('#B171D9')(match)
    }

    if (match.match(rnumber) !== null) {
      return chalk.hex('#73DEA7')(match)
    }

    if (match.match(rspecial) !== null) {
      return chalk.hex('#73A7DE')(match)
    }

    return match
  })
  return colored
}

export function stringTime(time: number, chalk: ChalkInstance) {
  if (time < 1000) {
    return `${highlight(String(time), chalk)} milliseconds`
  }

  return `${highlight((time / 1000).toFixed(2), chalk)} seconds`
}
