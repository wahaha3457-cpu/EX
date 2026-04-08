/**
 * ESLint 9 flat config — Vue + TS。
 * i18n 相关：推荐再接入 @intlify/eslint-plugin-vue-i18n（见 scripts/i18n/INTEGRATION.txt）。
 */
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', '*.min.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
      globals: { ...globals.browser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      /** 避免与现有大量模板风格冲突；格式化可交给 Prettier */
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
)
