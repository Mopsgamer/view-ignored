import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config(
  eslint.configs.recommended,
  stylistic.configs.recommended,
  tseslint.configs.recommended,
  { ignores: ['out/'] },
  {
    rules: {
      '@stylistic/indent': ['error', 2],
    },
  },
)
