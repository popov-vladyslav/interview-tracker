module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  testTimeout: 15000,
  watchman: false,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/routes/**/*.js",
    "src/middleware/**/*.js",
    "!src/db/**",
  ],
  setupFiles: ["<rootDir>/src/__tests__/env-setup.js"],
  transform: {
    "^.+\\.ts$": "<rootDir>/jest-ts-transformer.js",
  },
};
