const { FlatCompat } = require('@eslint/eslintrc');
const babelParser = require('@babel/eslint-parser');
const globals = require('globals');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {
    env: {
      browser: true,
      es2021: true
    },
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module'
    }
  }
});

module.exports = [
  ...compat.config({
    extends: ['eslint:recommended', 'plugin:react/recommended']
  }),
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react']
        },
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks')
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/no-unknown-property': ['error', { 
        ignore: ['jsx', 'global'] 
      }]
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]; 