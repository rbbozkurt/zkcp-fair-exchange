import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
            },
            globals: globals.browser,
        },
        plugins: {
            '@typescript-eslint': tseslint,
            react,
            'react-hooks': reactHooks,
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,

            'no-unused-vars': 'off',

            '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],

            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-react': 'error',        
            'react/jsx-uses-vars': 'error',          
            semi: ['error', 'always'],
            quotes: ['error', 'single'],
        },
        settings: {
            react: {
                version: '18.2', // or your actual version
            },
        },
    },
];
