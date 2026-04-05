const express = require("express");
const request = require("supertest");
const bcrypt = require("bcryptjs");

const mockGetUsuario = jest.fn();
const mockAuthorize = jest.fn(() => (req, res, next) => {
  req.account = { sub: { cc_usuario: "123" } };
  next();
});
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  get_usuario: (...args) => mockGetUsuario(...args),
  encriptar_clave: jest.fn(() => "hashed-new-password"),
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("PUT /self/password", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../usuario/usuario"));
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("returns 400 when the current password is missing", async () => {
    const app = buildApp();
    const response = await request(app).put("/self/password").send({
      contrasena_nueva: "ClaveSegura#2026",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("actual");
  });

  it("returns 400 when the new password is weak", async () => {
    const app = buildApp();
    const response = await request(app).put("/self/password").send({
      contrasena_actual: "ViejaClave#2026",
      contrasena_nueva: "abc123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("8 caracteres");
  });

  it("returns 400 when the current password does not match", async () => {
    mockGetUsuario.mockResolvedValue({
      contrasena_usuario: "hashed",
    });
    bcrypt.compare.mockImplementation((plain, hashed, cb) => cb(null, false));

    const app = buildApp();
    const response = await request(app).put("/self/password").send({
      contrasena_actual: "ViejaClave#2026",
      contrasena_nueva: "ClaveSegura#2026",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("no es correca");
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("returns 200 when the password is updated", async () => {
    mockGetUsuario.mockResolvedValue({
      contrasena_usuario: "hashed",
    });
    bcrypt.compare.mockImplementation((plain, hashed, cb) => cb(null, true));
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const app = buildApp();
    const response = await request(app).put("/self/password").send({
      contrasena_actual: "ViejaClave#2026",
      contrasena_nueva: "ClaveSegura#2026",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("cambi");
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });
});
