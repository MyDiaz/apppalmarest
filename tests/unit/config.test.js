describe("config connection data", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("uses database env vars when they are provided", () => {
    process.env.DB_NAME = "custom_db";
    process.env.DB_USER = "custom_user";
    process.env.DB_PASSWORD = "custom_password";
    process.env.DB_HOST = "db.example.com";
    process.env.DB_PORT = "6543";
    process.env.API_PREFIX = "/custom/api";

    const config = require("../../config");

    expect(config.connectionData).toEqual({
      user: "custom_user",
      host: "db.example.com",
      database: "custom_db",
      password: "custom_password",
      port: 6543,
      ssl: false,
    });
    expect(config.host.api_prefix).toBe("/custom/api");
  });

  it("falls back to the current defaults when env vars are missing", () => {
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.API_PREFIX;

    const config = require("../../config");

    expect(config.connectionData).toEqual({
      user: "postgres",
      host: "localhost",
      database: "SIGPA",
      password: "",
      port: 5432,
      ssl: false,
    });
    expect(config.host.api_prefix).toBe("/api");
  });

  it("enables ssl when DB_SSL is set", () => {
    process.env.DB_SSL = "true";

    const config = require("../../config");

    expect(config.connectionData.ssl).toEqual({
      rejectUnauthorized: false,
    });
  });
});
