module.exports = {
  env: {
    es2020: true,
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: [
    "plugin:react/recommended",
    "airbnb",
    "plugin:jest-dom/recommended",
    "plugin:testing-library/react",
  ],
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      experimentalDecorators: true,
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: "module",
  },
  plugins: ["react", "jest-dom", "testing-library"],
  rules: {
    // "jest-dom/prefer-checked": "error",
    // "jest-dom/prefer-enabled-disabled": "error",
    // "jest-dom/prefer-required": "error",
    // "jest-dom/prefer-to-have-attribute": "error",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: true,
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],
    "linebreak-style": [0, "error", "windows"],
    quotes: [0],
    semi: [0],
    "eol-last": 2,
    "no-tabs": 0,
  },
};
