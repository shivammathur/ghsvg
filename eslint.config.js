import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

const tsFiles = ['src/**/*.ts'];

export default [
  {
    ignores: ['lib/**', 'node_modules/**', 'cache/**']
  },
  {
    ...js.configs.recommended,
    files: tsFiles
  },
  ...tsPlugin.configs['flat/recommended'].map(config => ({
    ...config,
    files: tsFiles
  })),
  {
    ...importPlugin.flatConfigs.recommended,
    files: tsFiles
  },
  {
    ...importPlugin.flatConfigs.typescript,
    files: tsFiles
  },
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      },
      globals: globals.node
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      ...eslintConfigPrettier.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error'
    },
    settings: {
      'import/resolver': {
        typescript: true
      }
    }
  }
];
