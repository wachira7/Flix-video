//backend/.eslintrc.js
module.exports = {
    env: {
        browser: false,
        es2021: true,
        node: true,  // (explicitly enables Node.js globals)
    },
    extends: [
        'eslint:recommended',
        'plugin:node/recommended',  
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 2021,  //Use 2021 instead of 12 (clearer)
        sourceType: 'module',
    },
    globals: {
        // Allow globals we're using
        global: 'readonly',
    },
    rules: {
        // Console logs (keep off for backend)
        'no-console': 'off',
        
        // ES modules support
        'node/no-unsupported-features/es-syntax': [
            'error',
            { ignores: ['modules'] },
        ],
        
        //Prevent common issues in our codebase
        'node/no-missing-require': 'off',  // We use dynamic requires sometimes
        'node/no-unpublished-require': 'off',  // Allow dev dependencies in code
        'node/no-extraneous-require': 'warn',  // Warn about unused deps
        
        // Async/await best practices
        'require-await': 'warn',  // Warn if async function has no await
        'no-return-await': 'warn',  // Unnecessary return await
        
        // Prevent common mistakes
        'no-unused-vars': ['warn', { 
            argsIgnorePattern: '^_',  // Allow unused vars starting with _
            varsIgnorePattern: '^_'
        }],
        
        // Allow console methods we use
        'no-undef': 'error',  // Catch undefined variables
        
        //  OPTIONAL: Enforce best practices
        'prefer-const': 'warn',  // Suggest const when variable not reassigned
        'no-var': 'error',  // No var, use let/const
        'eqeqeq': ['warn', 'always'],  // Use === instead of ==
    },
};
    