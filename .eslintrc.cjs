module.exports = {
    extends: [
      "plugin:@shopify/typescript",
       "plugin:@shopify/prettier",
       "eslint:recommended",
       "plugin:@typescript-eslint/eslint-recommended",
       "plugin:@typescript-eslint/recommended"],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        "project": "tsconfig.json"
    },
    plugins: ['@typescript-eslint'],
    rules: {
        "no-console": 1,
        "prettier/prettier": 2 // Means error
    },
    root: true,
    env: {
        node: true
    }
};
