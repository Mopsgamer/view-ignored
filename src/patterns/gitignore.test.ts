import { ok } from 'node:assert/strict'
import { it } from 'node:test'
import { gitignoreMatch } from './gitignore.js'

it('gitignoreMatch', () => {
  ok(gitignoreMatch('.git', '.git/message'))

  ok(gitignoreMatch('node_modules', 'node_modules/x/message.ts'))

  ok(gitignoreMatch('**/.git', '.git/message'))

  ok(gitignoreMatch('/.git', '.git/message'))

  ok(gitignoreMatch('message', '.git/message'))

  ok(!gitignoreMatch('/message', '.git/message'))
})
