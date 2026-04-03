module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  clearMocks: true,
  collectCoverageFrom: [
    "autenticacion/**/*.js",
    "usuario/**/*.js",
    "!**/node_modules/**",
  ],
};
