const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

const shared = {
  testEnvironment: "node",
  rootDir: __dirname,
  transform: {
    ...tsJestTransformCfg,
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};

/** @type {import("jest").Config} **/
module.exports = {
  projects: [
    {
      ...shared,
      displayName: "unit",
      testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
      testPathIgnorePatterns: [...shared.testPathIgnorePatterns, "/src/tests/api/"],
    },
    {
      ...shared,
      displayName: "api",
      testMatch: ["<rootDir>/src/tests/api/**/*.test.ts"],
      globalSetup: "<rootDir>/src/tests/api/support/global-setup.ts",
      setupFiles: ["<rootDir>/src/tests/api/support/env.ts"],
    },
  ],
};
