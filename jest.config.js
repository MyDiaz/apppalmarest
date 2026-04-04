module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  clearMocks: true,
  collectCoverageFrom: [
    "*.js",
    "**/*.js",
    "!**/node_modules/**",
    "!coverage/**",
    "!tests/**",
  ],
};
