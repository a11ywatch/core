import mongodbPreset from "@shelf/jest-mongodb/jest-preset";

export = {
  ...mongodbPreset,
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  verbose: true,
  coverageDirectory: "./coverage/",
  collectCoverage: true,
};
