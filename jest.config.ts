import type { JestConfigWithTsJest } from "ts-jest";

// @link https://kulshekhar.github.io/ts-jest/docs/getting-started/options

const jestConfig: JestConfigWithTsJest = {
  // [...]
  // Replace `ts-jest` with the preset you want to use
  // from the above list
  preset: "ts-jest",
};

export default jestConfig;
