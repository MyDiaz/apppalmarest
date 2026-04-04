const express = require("express");
const request = require("supertest");

const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();
const mockPassportUse = jest.fn();
const mockPassportAuthorize = jest.fn(() => (req, res, next) => next());

jest.mock("passport", () => ({
  use: (...args) => mockPassportUse(...args),
  authorize: (...args) => mockPassportAuthorize(...args),
}));

jest.mock("passport-jwt", () => ({
  Strategy: jest.fn(),
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn(() => jest.fn()),
  },
}));

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

const { authorize, rutas } = require("../../../autenticacion/util");

describe("autenticacion/util authorize and test routes", () => {
  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
    global.process.module = { filename: "util-authorize.test.js" };
  });

  it("returns null when roles is not an array", () => {
    expect(authorize("admin")).toBeNull();
  });

  it("returns 401 when there is no token user", async () => {
    const middleware = authorize(["user"])[1];
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await middleware({}, res, jest.fn());
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it("returns 401 when the database user does not exist", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const middleware = authorize(["user"])[1];
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await middleware(
      { account: { sub: { cc_usuario: "123" } } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("No existe") })
    );
  });

  it("returns 403 when the role is not allowed", async () => {
    mockQuery.mockResolvedValue({ rows: [{ rol: "admin" }] });
    const middleware = authorize(["user"])[1];
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await middleware(
      { account: { sub: { cc_usuario: "123" } } },
      res,
      jest.fn()
    );
    await flushPromises();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it("calls next when the role is allowed", async () => {
    mockQuery.mockResolvedValue({ rows: [{ rol: "admin" }] });
    const middleware = authorize(["admin"])[1];
    const next = jest.fn();
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await middleware(
      { account: { sub: { cc_usuario: "123" } } },
      res,
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.send).not.toHaveBeenCalled();
  });

  it("allows any role when the roles list is empty", async () => {
    mockQuery.mockResolvedValue({ rows: [{ rol: "guest" }] });
    const middleware = authorize([])[1];
    const next = jest.fn();
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await middleware(
      { account: { sub: { cc_usuario: "123" } } },
      res,
      next
    );
    await flushPromises();

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns the encrypted password on the test endpoint", async () => {
    const app = express();
    app.use(express.json());
    app.use(rutas);

    const response = await request(app)
      .post("/test/encriptar")
      .send({ contrasenia: "ClaveSegura#2026" });

    expect(response.status).toBe(200);
    expect(response.body.message).toEqual(expect.any(String));
    expect(response.body.message).not.toBe("ClaveSegura#2026");
  });
});
