const request = require("supertest");

describe("ping route", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("responds on the default API prefix", async () => {
    delete process.env.API_PREFIX;

    const { app } = require("../../index");
    const response = await request(app).get("/api/ping");

    expect(response.status).toBe(200);
    expect(response.text).toBe("pong");
  });

  it("responds on a custom API prefix", async () => {
    process.env.API_PREFIX = "/custom/api";

    const { app } = require("../../index");
    const response = await request(app).get("/custom/api/ping");

    expect(response.status).toBe(200);
    expect(response.text).toBe("pong");
  });
});
