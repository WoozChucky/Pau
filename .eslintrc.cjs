module.exports = {
    extends: [
      "plugin:@shopify/typescript",
      "plugin:@shopify/prettier",
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended"],
    parser: '@typescript-eslint/parser',
    overrides: [
      {
        files: ['*.ts'],
        parserOptions: {
          project: ['./tsconfig.json'], // Specify it only for TypeScript files
        },
      }
    ],
    plugins: ['@typescript-eslint'],
    rules: {
        // 0 - disabled     1 - warning   2 - error
        "no-console": 2,
        "prettier/prettier": ['error', { singleQuote: true,  }],
        'max-len': [2, { code: 120, ignoreUrls: true }],
        'quotes': [2, "single", { "avoidEscape": true, "allowTemplateLiterals": true }]
    },
    root: true,
    env: {
        node: true
    }
};
